"""Llama 3.2 11B Vision Instruct via Transformers (local) - image analysis alternative to Gemini."""

import asyncio
import io
import json
import re
from typing import Any

from app.config import get_settings
from app.services.ai.base import PetAnalyzer

IMAGE_PROMPT = """Analyze this image of an animal (pet or wildlife). Return ONLY a single JSON object with no markdown or explanation, using this exact structure. Percentages must sum to 100 per category when multiple options are given.

{
  "species": [{"species": "<name>", "percentage": <0-100>}, ...],
  "breeds": [{"breed": "<name>", "percentage": <0-100>}, ...],
  "primary_breed_or_species": "<single display label>",
  "match_score": <0-100>,
  "description": "<1-3 sentences about traits and breed heritage>",
  "tags": ["<trait1>", "<trait2>", "<trait3>"]
}

Rules:
- species and breeds: as above. primary_breed_or_species: one label. match_score: 0-100. description: short paragraph. tags: 3-6 trait words.
- Return only the JSON object, nothing else."""

# Lazy-loaded model and processor
_model = None
_processor = None


def _get_llama_device_map() -> str:
    """Use CUDA when available, else auto (CPU/multi-GPU)."""
    import torch
    return "cuda" if torch.cuda.is_available() else "auto"


def _get_model_and_processor():
    """Load vision model and processor once (runs on first use)."""
    global _model, _processor
    if _model is None:
        import torch
        from transformers import AutoProcessor, MllamaForConditionalGeneration

        settings = get_settings()
        model_id = settings.hf_llama_vision_model
        token = settings.hf_token or None
        device_map = _get_llama_device_map()
        _model = MllamaForConditionalGeneration.from_pretrained(
            model_id,
            device_map=device_map,
            torch_dtype=torch.bfloat16,
            token=token,
        )
        _processor = AutoProcessor.from_pretrained(model_id, token=token)
    return _model, _processor


def _run_vision_sync(image_bytes: bytes, prompt: str, max_new_tokens: int = 512) -> str:
    """Synchronous vision inference (run in thread from async)."""
    from PIL import Image

    model, processor = _get_model_and_processor()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    messages = [
        [
            {
                "role": "user",
                "content": [{"type": "image"}, {"type": "text", "text": prompt}],
            }
        ]
    ]
    input_text = processor.apply_chat_template(
        messages, add_generation_prompt=True, tokenize=False
    )
    if isinstance(input_text, list):
        input_text = input_text[0] if input_text else ""
    inputs = processor(
        text=input_text,
        images=image,
        return_tensors="pt",
    ).to(model.device)
    output = model.generate(**inputs, max_new_tokens=max_new_tokens, do_sample=False)
    raw = processor.decode(output[0], skip_special_tokens=True)
    # Strip the prompt prefix if present so we get only the model reply
    if input_text in raw:
        raw = raw.split(input_text)[-1].strip()
    return raw


def _parse_json(text: str) -> dict[str, Any]:
    raw = text.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


class LlamaVisionAnalyzer(PetAnalyzer):
    """
    meta-llama/Llama-3.2-11B-Vision-Instruct via Transformers (local).
    Image analysis (alternative to Gemini). Audio not supported.
    """

    model_id = "llama_vision"

    def __init__(self) -> None:
        settings = get_settings()
        self._model = settings.hf_llama_vision_model
        self._token = settings.hf_token

    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> dict[str, Any]:
        try:
            text = await asyncio.to_thread(
                _run_vision_sync, image_bytes, IMAGE_PROMPT, 512
            )
        except Exception as e:
            if "401" in str(e) or "403" in str(e) or "404" in str(e):
                raise ValueError(
                    f"Model {self._model} may not be available or requires license. "
                    "Accept the model license at https://huggingface.co/meta-llama/Llama-3.2-11B-Vision-Instruct"
                ) from e
            raise
        if not text:
            return {"species": [{"species": "unknown", "percentage": 100}], "breeds": []}
        try:
            return _parse_json(text)
        except (json.JSONDecodeError, ValueError):
            return {"species": [{"species": "unknown", "percentage": 100}], "breeds": []}

    async def analyze_audio(self, audio_bytes: bytes, mime_type: str) -> dict[str, Any]:
        raise NotImplementedError(
            "Llama 3.2 11B Vision does not support audio. Use model=gemini for audio analysis."
        )
