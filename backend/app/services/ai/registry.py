"""Registry of AI analyzers - select by model id (gemini | llama | llama_vision)."""

from app.config import get_settings
from app.services.ai.base import PetAnalyzer
from app.services.ai.gemini_provider import GeminiAnalyzer
from app.services.ai.llama_provider import LlamaAnalyzer
from app.services.ai.llama_vision_provider import LlamaVisionAnalyzer

_REGISTRY: dict[str, type[PetAnalyzer]] = {
    "gemini": GeminiAnalyzer,
    "llama": LlamaAnalyzer,
    "llama_vision": LlamaVisionAnalyzer,
}

# Human-readable model names for API
MODEL_IDS = [
    ("gemini", "Gemini (image + audio)"),
    ("llama_vision", "Llama 3.2 11B Vision Instruct (Hugging Face, image; alternative to Gemini)"),
    ("llama", "Llama 3.2 1B Instruct (Hugging Face, text-only)"),
]


def get_analyzer(model_id: str | None = None) -> PetAnalyzer:
    """Return analyzer for model_id. Default from config or gemini."""
    id_ = (model_id or "").strip().lower() or get_settings().gemini_model
    # Map common names to our ids
    if id_ in ("gemini", "gemini-1.5-flash", "gemini-1.5"):
        id_ = "gemini"
    if id_ in ("llama_vision", "llama-vision", "llama3.2-11b-vision", "llama 11b vision"):
        id_ = "llama_vision"
    if id_ in ("llama", "llama3.2", "llama3.2:1b", "huggingface", "hf"):
        id_ = "llama"
    if id_ not in _REGISTRY:
        raise ValueError(f"Unknown model: {model_id}. Choose from: {list(_REGISTRY.keys())}")
    return _REGISTRY[id_]()
