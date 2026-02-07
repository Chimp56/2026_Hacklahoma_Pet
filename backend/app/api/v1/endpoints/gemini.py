"""Gemini API endpoints - pet image analysis."""

import json
import re
from io import BytesIO
from typing import Any

import google.generativeai as genai
from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image

from app.config import get_settings
from app.schemas.gemini import PetAnalysisResponse

router = APIRouter(prefix="/gemini", tags=["gemini"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

PROMPT = """Analyze this image of an animal (pet or wildlife). Return ONLY a single JSON object with no markdown or explanation, using this exact structure. Percentages must sum to 100 per category when multiple options are given.

{
  "species": [{"species": "<name>", "percentage": <0-100>}, ...],
  "breeds": [{"breed": "<name>", "percentage": <0-100>}, ...]
}

Rules:
- species: list possible species with confidence percentages (e.g. dog 95%, wolf 5%). If only one animal is clearly one species, use one entry with 100.
- breeds: list possible breeds with confidence percentages when the species has breeds (e.g. dog -> Golden Retriever 80%, Labrador 20%). If species has no breed concept (e.g. goldfish) or cannot be determined, use empty list [].
- Return only the JSON object, nothing else."""


def _parse_json_from_response(text: str) -> dict[str, Any]:
    """Extract JSON from model response, stripping markdown code blocks if present."""
    raw = text.strip()
    # Remove optional markdown code fence
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


@router.post("/analyze-pet", response_model=PetAnalysisResponse)
async def analyze_pet_image(
    file: UploadFile = File(..., description="Image of a pet to analyze"),
) -> PetAnalysisResponse:
    """
    Upload an image of a pet; returns structured JSON with species and/or breed
    percentages (confidence scores) from Gemini vision.
    """
    settings = get_settings()
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key not configured. Set GEMINI_API_KEY in .env",
        )

    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )

    body = await file.read()
    if len(body) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)} MB",
        )

    try:
        image = Image.open(BytesIO(body))
        if image.mode not in ("RGB", "RGBA", "L"):
            image = image.convert("RGB")
    except OSError as e:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted image: {e!s}") from e

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.gemini_model)

    try:
        response = model.generate_content([image, PROMPT])
        text = response.text
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e!s}") from e

    if not text:
        raise HTTPException(status_code=502, detail="Gemini returned empty response")

    try:
        data = _parse_json_from_response(text)
        return PetAnalysisResponse.model_validate(data)
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse Gemini response as JSON: {e!s}",
        ) from e
