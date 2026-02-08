"""Gemini provider - image and audio analysis with API key rotation on rate limit."""

import json
import re
from io import BytesIO
from typing import Any, Callable

from google import genai
from google.genai import types

from app.config import get_settings
from app.services.ai.base import PetAnalyzer


def _is_rate_limit_error(exc: BaseException) -> bool:
    """True if the exception looks like a Gemini rate limit / quota error."""
    msg = (getattr(exc, "message", "") or str(exc)).lower()
    code = getattr(exc, "code", None)
    if code is not None and getattr(code, "name", "") == "RESOURCE_EXHAUSTED":
        return True
    if "429" in str(exc) or "resource_exhausted" in msg:
        return True
    if "rate limit" in msg or "quota" in msg or "resource exhausted" in msg:
        return True
    return False

IMAGE_PROMPT = """Analyze this image of an animal (pet or wildlife). Return ONLY a single JSON object with no markdown or explanation, using this exact structure. Percentages must sum to 100 per category when multiple options are given.

{
  "species": [{"species": "<name>", "percentage": <0-100>}, ...],
  "breeds": [{"breed": "<name>", "percentage": <0-100>}, ...]
}

Rules:
- species: list possible species with confidence percentages. If only one animal is clearly one species, use one entry with 100.
- breeds: list possible breeds with confidence when applicable. If no breed concept, use [].
- Return only the JSON object, nothing else."""

AUDIO_PROMPT = """Analyze this audio of an animal (pet sounds: barking, meowing, etc.). Return ONLY a single JSON object with no markdown, using this structure:

{
  "mood": "<inferred mood or state: e.g. excited, anxious, playful, distressed, calm, curious>",
  "confidence": <0.0-1.0 number for how confident you are in the analysis>,
  "species": [{"species": "<name>", "percentage": <0-100>}, ...],
  "breeds": [{"breed": "<name>", "percentage": <0-100>}, ...],
  "description": "<short description of the sound>"
}

Return only the JSON object."""

ACTIVITY_PROMPT = """Look at this image of a pet (or pet environment). Infer from visible cues (e.g. resting, food bowl, time of day) and return ONLY a single JSON object with no markdown:

{
  "sleep_minutes": <integer, estimated sleep or rest minutes for the day so far; 0 if unknown>,
  "meals_count": <integer, estimated number of meals today; 0 if unknown>,
  "activity": "<one of: Low, Normal, High, or Unknown>"
}

Return only the JSON object."""

VIDEO_ACTIVITY_PROMPT = """Watch this video of a pet. Analyze the full video and return ONLY a single JSON object with no markdown or explanation. Estimate based on what you see in the video (and infer typical patterns if the video is a short clip).

{
  "activity_summary": "<string: concise summary of what the pet did in the video - activities, behaviors, notable moments>",
  "hours_slept_per_day": <number 0-24: estimated hours the pet sleeps per day; use 0 if no sleep/rest visible or unknown>,
  "hours_active": <number 0-24: estimated hours the pet is active per day; use 0 if unknown>,
  "eating_habits": "<string: observed or inferred eating habits - e.g. meal frequency, appetite, grazing, feeding behavior, or 'Not observed' if no eating in video>"
}

Rules:
- activity_summary: describe specific activities (playing, resting, eating, walking, etc.) seen in the video.
- hours_slept_per_day and hours_active: if the video is a short clip, estimate typical daily totals; otherwise base on what you see.
- eating_habits: only describe if eating is visible or strongly implied; otherwise use "Not observed".
Return only the JSON object, nothing else."""


def _parse_json(text: str) -> dict[str, Any]:
    raw = text.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


class GeminiAnalyzer(PetAnalyzer):
    """Use Gemini for image and audio analysis; rotates API keys on rate limit."""

    model_id = "gemini"

    def __init__(self) -> None:
        settings = get_settings()
        self._keys = settings.gemini_api_keys_list
        self._model_name = settings.gemini_model
        self._key_index = 0

    def _ensure_configured(self) -> None:
        if not self._keys:
            raise ValueError(
                "No Gemini API key set. Set GEMINI_API_KEY (and optionally GEMINI_API_KEY2, GEMINI_API_KEY3 for rotation)."
            )

    def _rotate_and_retry(self, fn: Callable[[genai.Client], Any]) -> Any:
        """Run fn(client); on rate limit, rotate to next key and retry until success or out of keys."""
        self._ensure_configured()
        last_exc = None
        for _ in range(len(self._keys)):
            api_key = self._keys[self._key_index]
            client = genai.Client(api_key=api_key)
            try:
                result = fn(client)
                return result
            except Exception as e:
                if _is_rate_limit_error(e):
                    last_exc = e
                    self._key_index = (self._key_index + 1) % len(self._keys)
                    continue
                raise
        if last_exc is not None:
            raise last_exc
        raise ValueError("No Gemini API keys available")

    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> dict[str, Any]:
        def _generate(client: genai.Client) -> dict[str, Any]:
            response = client.models.generate_content(
                model=self._model_name,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    IMAGE_PROMPT,
                ],
            )
            text = (response.text or "{}").strip()
            return _parse_json(text)

        return self._rotate_and_retry(_generate)

    async def analyze_audio(self, audio_bytes: bytes, mime_type: str) -> dict[str, Any]:
        import os
        import tempfile

        suffix = ".wav" if "wav" in mime_type else ".mp3"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
            f.write(audio_bytes)
            path = f.name
        try:

            def _generate(client: genai.Client) -> dict[str, Any]:
                uploaded = client.files.upload(file=path, mime_type=mime_type)
                response = client.models.generate_content(
                    model=self._model_name,
                    contents=[uploaded, AUDIO_PROMPT],
                )
                text = (response.text or "{}").strip()
                return _parse_json(text)

            return self._rotate_and_retry(_generate)
        finally:
            try:
                os.unlink(path)
            except OSError:
                pass

    async def analyze_activity(self, image_bytes: bytes, mime_type: str) -> dict[str, Any]:
        """Infer sleep/meals/activity from a single image (e.g. camera frame)."""

        def _generate(client: genai.Client) -> dict[str, Any]:
            response = client.models.generate_content(
                model=self._model_name,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    ACTIVITY_PROMPT,
                ],
            )
            text = (response.text or "{}").strip()
            return _parse_json(text)

        return self._rotate_and_retry(_generate)

    async def analyze_pet_video(self, video_bytes: bytes, mime_type: str) -> dict[str, Any]:
        """Analyze pet video; return activity summary, hours slept, hours active, eating habits."""

        import os
        import tempfile

        suffix = ".mp4" if "mp4" in mime_type else ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
            f.write(video_bytes)
            path = f.name
        try:

            def _generate(client: genai.Client) -> dict[str, Any]:
                uploaded = client.files.upload(file=path, mime_type=mime_type)
                response = client.models.generate_content(
                    model=self._model_name,
                    contents=[uploaded, VIDEO_ACTIVITY_PROMPT],
                )
                text = (response.text or "{}").strip()
                return _parse_json(text)

            return self._rotate_and_retry(_generate)
        finally:
            try:
                os.unlink(path)
            except OSError:
                pass
