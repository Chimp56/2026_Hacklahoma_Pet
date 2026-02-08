"""Llama 3.2 1B Instruct via Transformers pipeline (text-only; local)."""

import asyncio
from typing import Any

from app.config import get_settings
from app.services.ai.base import PetAnalyzer

# Lazy-loaded pipeline (avoid import at module load)
_pipeline = None


def _get_llama_device_map() -> str:
    """Use CUDA when available, else auto (CPU/multi-GPU)."""
    import torch
    return "cuda" if torch.cuda.is_available() else "auto"


def _get_pipeline():
    """Load text-generation pipeline once (runs on first use)."""
    global _pipeline
    if _pipeline is None:
        from transformers import pipeline

        settings = get_settings()
        model = settings.hf_llama_model
        token = settings.hf_token or None  # For gated models (e.g. Llama)
        device_map = _get_llama_device_map()
        _pipeline = pipeline(
            "text-generation",
            model=model,
            token=token,
            model_kwargs={"torch_dtype": "auto", "device_map": device_map},
        )
    return _pipeline


def _run_pipeline_sync(prompt: str, max_new_tokens: int = 512) -> str:
    """Synchronous pipeline call (run in thread from async)."""
    pipe = _get_pipeline()
    out = pipe(
        prompt,
        max_new_tokens=max_new_tokens,
        do_sample=False,
        pad_token_id=pipe.tokenizer.eos_token_id,
        truncation=True,
    )
    if not out or not isinstance(out, list):
        return ""
    text = out[0].get("generated_text") or ""
    if text.startswith(prompt):
        text = text[len(prompt) :].strip()
    return text.strip()


class LlamaAnalyzer(PetAnalyzer):
    """
    meta-llama/Llama-3.2-1B-Instruct via Transformers pipeline (local).
    Text-only: image and audio not supported; use Gemini or llama_vision.
    """

    model_id = "llama"

    def __init__(self) -> None:
        settings = get_settings()
        self._model = settings.hf_llama_model

    async def _generate(self, prompt: str, max_new_tokens: int = 512) -> str:
        return await asyncio.to_thread(_run_pipeline_sync, prompt, max_new_tokens)

    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> dict[str, Any]:
        raise NotImplementedError(
            "Llama 3.2 1B Instruct is text-only and cannot analyze images. Use model=gemini or model=llama_vision."
        )

    async def analyze_audio(self, audio_bytes: bytes, mime_type: str) -> dict[str, Any]:
        raise NotImplementedError(
            "Llama 3.2 1B Instruct does not support audio. Use model=gemini for audio analysis."
        )

    async def generate_text(self, prompt: str, max_new_tokens: int = 512) -> str:
        """Text generation via Transformers pipeline."""
        return await self._generate(prompt, max_new_tokens=max_new_tokens)
