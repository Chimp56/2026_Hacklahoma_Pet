"""Tests for Gemini/AI API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_models(client: AsyncClient) -> None:
    """GET /api/v1/gemini/models returns available models."""
    resp = await client.get("/api/v1/gemini/models")
    assert resp.status_code == 200
    models = resp.json()
    assert isinstance(models, list)
    assert len(models) >= 1
    assert any("gemini" in str(m).lower() for m in models)


@pytest.mark.asyncio
async def test_analyze_pet_image_invalid_type(client: AsyncClient) -> None:
    """POST /api/v1/gemini/analyze-pet with invalid content-type returns 400."""
    files = {"file": ("test.txt", b"not an image", "text/plain")}
    resp = await client.post("/api/v1/gemini/analyze-pet", files=files)
    assert resp.status_code == 400
    assert "Invalid file type" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_analyze_pet_image_unknown_model(client: AsyncClient) -> None:
    """POST /api/v1/gemini/analyze-pet with unknown model returns 400."""
    files = {"file": ("pet.jpg", b"\xff\xd8\xff fake jpeg", "image/jpeg")}
    resp = await client.post(
        "/api/v1/gemini/analyze-pet",
        files=files,
        params={"model": "nonexistent_model"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_analyze_pet_audio_invalid_type(client: AsyncClient) -> None:
    """POST /api/v1/gemini/analyze-audio with invalid type returns 400."""
    files = {"file": ("test.txt", b"not audio", "text/plain")}
    resp = await client.post("/api/v1/gemini/analyze-audio", files=files)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_generate_text_unsupported_model(client: AsyncClient) -> None:
    """POST /api/v1/gemini/generate-text with gemini returns 400 (text gen is llama only)."""
    resp = await client.post(
        "/api/v1/gemini/generate-text",
        json={"prompt": "Hello", "max_new_tokens": 10},
        params={"model": "gemini"},
    )
    assert resp.status_code == 400
    assert "llama" in resp.json()["detail"].lower()
