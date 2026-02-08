"""AI analysis endpoints - image and audio via Gemini or Llama (model choice)."""

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.schemas.gemini import (
    ActivityAnalysisResponse,
    AudioAnalysisResponse,
    GenerateTextRequest,
    PetAnalysisResponse,
    PetVideoAnalysisResponse,
)
from app.services.ai.llama_provider import LlamaAnalyzer
from app.services.ai.registry import MODEL_IDS, get_analyzer

router = APIRouter(prefix="/gemini", tags=["ai"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_AUDIO_TYPES = {"audio/wav", "audio/wave", "audio/mpeg", "audio/mp3", "audio/webm"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB for video


@router.get("/models", response_model=list[tuple[str, str]])
async def list_models() -> list[tuple[str, str]]:
    """List available AI models for analysis (e.g. gemini, llama)."""
    return MODEL_IDS


@router.post("/analyze-pet", response_model=PetAnalysisResponse)
async def analyze_pet_image(
    file: UploadFile = File(..., description="Image of a pet to analyze"),
    model: str = Query("gemini", description="Model id: gemini | llama_vision (image); llama is text-only"),
) -> PetAnalysisResponse:
    """
    Upload an image; get species and breed percentages.
    Use model=gemini or model=llama_vision for images; llama is text-only.
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}",
        )

    body = await file.read()
    if len(body) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)} MB",
        )

    try:
        analyzer = get_analyzer(model)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    try:
        result = await analyzer.analyze_image(body, content_type)
    except NotImplementedError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider error: {e!s}") from e

    return PetAnalysisResponse.model_validate(result)


def _normalize_audio_response(raw: dict) -> AudioAnalysisResponse:
    """Map provider dict to stable AudioAnalysisResponse (mood, confidence 0-1, species, breeds)."""
    mood = raw.get("mood") or raw.get("description") or ""
    if not isinstance(mood, str):
        mood = str(mood) if mood is not None else ""
    conf = raw.get("confidence")
    if conf is None:
        # Fallback: use first species percentage as 0-1
        species_list = raw.get("species") or []
        if species_list and isinstance(species_list[0], dict):
            pct = species_list[0].get("percentage", 0)
            conf = float(pct) / 100.0 if pct is not None else 0.0
        else:
            conf = 0.0
    else:
        conf = float(conf)
        if conf > 1.0:
            conf = conf / 100.0
    conf = max(0.0, min(1.0, conf))
    species = raw.get("species") or []
    breeds = raw.get("breeds") or []
    # Normalize to {species/breed, percentage}
    def norm_guess(item: dict, name_key: str) -> dict:
        if isinstance(item, dict):
            name = item.get(name_key) or item.get("name") or ""
            pct = item.get("percentage")
            if pct is not None:
                pct = float(pct)
            else:
                pct = 0.0
            return {"species": name, "percentage": pct} if name_key == "species" else {"breed": name, "percentage": pct}
        return {"species": "", "percentage": 0.0} if name_key == "species" else {"breed": "", "percentage": 0.0}
    species_guesses = [norm_guess(s, "species") for s in species if isinstance(s, dict)]
    breed_guesses = [norm_guess(b, "breed") for b in breeds if isinstance(b, dict)]
    description = raw.get("description")
    if isinstance(description, str):
        pass
    else:
        description = None
    return AudioAnalysisResponse(
        mood=mood,
        confidence=conf,
        species=species_guesses,
        breeds=breed_guesses,
        description=description,
    )


@router.post("/analyze-audio", response_model=AudioAnalysisResponse)
async def analyze_pet_audio(
    file: UploadFile = File(..., description="Audio of pet (e.g. barking)"),
    model: str = Query("gemini", description="Model id (audio supported: gemini only)"),
) -> AudioAnalysisResponse:
    """Analyze audio; returns normalized mood, confidence (0-1), species/breeds, description. Only Gemini supports audio."""
    content_type = file.content_type or ""
    if content_type not in ALLOWED_AUDIO_TYPES and not file.filename:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_AUDIO_TYPES)}",
        )
    body = await file.read()
    if len(body) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large.")

    try:
        analyzer = get_analyzer(model)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    try:
        result = await analyzer.analyze_audio(body, content_type or "audio/wav")
    except NotImplementedError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider error: {e!s}") from e

    return _normalize_audio_response(result)


def _normalize_video_response(raw: dict) -> PetVideoAnalysisResponse:
    """Map provider dict to PetVideoAnalysisResponse."""
    activity = raw.get("activity_summary", "")
    if not isinstance(activity, str):
        activity = str(activity) if activity is not None else ""

    def _float_bounded(key: str, default: float = 0.0, lo: float = 0.0, hi: float = 24.0) -> float:
        v = raw.get(key)
        if v is None:
            return default
        try:
            v = float(v)
        except (TypeError, ValueError):
            return default
        return max(lo, min(hi, v))

    hours_slept = _float_bounded("hours_slept_per_day")
    hours_active = _float_bounded("hours_active")
    eating = raw.get("eating_habits", "")
    if not isinstance(eating, str):
        eating = str(eating) if eating is not None else ""
    return PetVideoAnalysisResponse(
        activity_summary=activity.strip(),
        hours_slept_per_day=hours_slept,
        hours_active=hours_active,
        eating_habits=eating.strip(),
    )


def _normalize_activity_response(raw: dict) -> ActivityAnalysisResponse:
    """Map provider dict to ActivityAnalysisResponse (sleep_minutes, meals_count, activity)."""
    sleep = raw.get("sleep_minutes")
    if sleep is None:
        sleep = raw.get("sleep", 0)
    try:
        sleep = int(sleep)
    except (TypeError, ValueError):
        sleep = 0
    sleep = max(0, sleep)

    meals = raw.get("meals_count")
    if meals is None:
        meals = raw.get("meals", 0)
    try:
        meals = int(meals)
    except (TypeError, ValueError):
        meals = 0
    meals = max(0, meals)

    activity = raw.get("activity", "Unknown")
    if not isinstance(activity, str):
        activity = str(activity) if activity is not None else "Unknown"
    activity = activity.strip() or "Unknown"
    return ActivityAnalysisResponse(sleep_minutes=sleep, meals_count=meals, activity=activity)


@router.post("/analyze-activity", response_model=ActivityAnalysisResponse)
async def analyze_activity(
    file: UploadFile = File(..., description="Image (or single frame) of pet for activity inference"),
    model: str = Query("gemini", description="Model id (activity analysis supported: gemini only)"),
) -> ActivityAnalysisResponse:
    """
    Infer activity from an image: estimated sleep minutes, meals count, and activity level.
    For Monitor/Camera page. Only Gemini supports this; use model=gemini.
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}",
        )
    body = await file.read()
    if len(body) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)} MB",
        )
    try:
        analyzer = get_analyzer(model)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    try:
        result = await analyzer.analyze_activity(body, content_type)
    except NotImplementedError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider error: {e!s}") from e
    return _normalize_activity_response(result)


@router.post("/analyze-pet-video", response_model=PetVideoAnalysisResponse)
async def analyze_pet_video(
    file: UploadFile = File(..., description="Video of pet to analyze (activity, sleep, eating)"),
    model: str = Query("gemini", description="Model id (video analysis supported: gemini only)"),
) -> PetVideoAnalysisResponse:
    """
    Analyze a pet video with Gemini. Returns activity summary (what they did), estimated hours
    slept per day, hours active, and eating habits. Only Gemini supports video; use model=gemini.
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_VIDEO_TYPES)}",
        )
    body = await file.read()
    if len(body) > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Video too large. Max size: {MAX_VIDEO_SIZE // (1024*1024)} MB",
        )
    try:
        analyzer = get_analyzer(model)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    try:
        result = await analyzer.analyze_pet_video(body, content_type)
    except NotImplementedError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider error: {e!s}") from e
    return _normalize_video_response(result)


@router.post("/generate-text", response_model=dict)
async def generate_text(
    body: GenerateTextRequest,
    model: str = Query("llama", description="Model id (Llama from Hugging Face only)"),
) -> dict:
    """Generate text using Llama 3.2 1B Instruct (Hugging Face). Set HF_TOKEN in .env."""
    try:
        analyzer = get_analyzer(model)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    if not isinstance(analyzer, LlamaAnalyzer):
        raise HTTPException(
            status_code=400,
            detail="Text generation is only supported with model=llama (Hugging Face).",
        )
    try:
        text = await analyzer.generate_text(body.prompt, max_new_tokens=body.max_new_tokens)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider error: {e!s}") from e
    return {"model": model, "generated_text": text}
