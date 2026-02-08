"""AI analysis endpoints - image and audio via Gemini or Llama (model choice)."""

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.schemas.gemini import GenerateTextRequest, PetAnalysisResponse
from app.services.ai.llama_provider import LlamaAnalyzer
from app.services.ai.registry import MODEL_IDS, get_analyzer

router = APIRouter(prefix="/gemini", tags=["ai"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_AUDIO_TYPES = {"audio/wav", "audio/wave", "audio/mpeg", "audio/mp3", "audio/webm"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


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


@router.post("/analyze-audio", response_model=dict)
async def analyze_pet_audio(
    file: UploadFile = File(..., description="Audio of pet (e.g. barking)"),
    model: str = Query("gemini", description="Model id (audio supported: gemini only)"),
) -> dict:
    """Analyze audio; returns species/breeds/description. Only Gemini supports audio."""
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

    return result


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
