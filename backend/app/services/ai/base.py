"""Abstract interface for pet image/audio analysis - species and breed percentages."""

from abc import ABC, abstractmethod
from typing import Any


class PetAnalyzer(ABC):
    """Analyze pet images (and optionally audio) and return structured results."""

    model_id: str = ""

    @abstractmethod
    async def analyze_image(self, image_bytes: bytes, mime_type: str) -> dict[str, Any]:
        """Analyze image; return dict with 'species' and 'breeds' lists of {name, percentage}."""
        ...

    async def analyze_audio(self, audio_bytes: bytes, mime_type: str) -> dict[str, Any]:
        """Analyze audio (e.g. barking); return structured result. Default: not supported."""
        raise NotImplementedError("Audio analysis not supported for this model")
