"""Tests for AI registry and analyzers."""

import pytest

from app.services.ai.registry import MODEL_IDS, get_analyzer


def test_model_ids_non_empty() -> None:
    """MODEL_IDS contains at least one model."""
    assert len(MODEL_IDS) >= 1
    for item in MODEL_IDS:
        assert isinstance(item, tuple)
        assert len(item) == 2


def test_get_analyzer_gemini() -> None:
    """get_analyzer returns Gemini analyzer for gemini id."""
    analyzer = get_analyzer("gemini")
    assert analyzer is not None
    assert analyzer.model_id == "gemini"


def test_get_analyzer_llama() -> None:
    """get_analyzer returns Llama analyzer for llama id."""
    analyzer = get_analyzer("llama")
    assert analyzer is not None
    assert analyzer.model_id == "llama"


def test_get_analyzer_llama_vision() -> None:
    """get_analyzer returns LlamaVision analyzer for llama_vision id."""
    analyzer = get_analyzer("llama_vision")
    assert analyzer is not None
    assert analyzer.model_id == "llama_vision"


def test_get_analyzer_unknown_raises() -> None:
    """get_analyzer raises ValueError for unknown model."""
    with pytest.raises(ValueError, match="Unknown model"):
        get_analyzer("unknown_model")


def test_get_analyzer_aliases() -> None:
    """get_analyzer accepts common aliases."""
    g = get_analyzer("gemini-1.5-flash")
    assert g.model_id == "gemini"
    lv = get_analyzer("llama-vision")
    assert lv.model_id == "llama_vision"
    l = get_analyzer("hf")
    assert l.model_id == "llama"
