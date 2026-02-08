"""Tests for media API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_upload_media_invalid_file_type(client: AsyncClient) -> None:
    """POST /api/v1/media/upload with invalid file_type returns 400."""
    resp = await client.post(
        "/api/v1/media/upload",
        params={"file_type": "invalid"},
        files={"file": ("test.jpg", b"fake image", "image/jpeg")},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_upload_media_image(client: AsyncClient, temp_storage_path) -> None:
    """POST /api/v1/media/upload with image succeeds."""
    jpeg = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 100
    resp = await client.post(
        "/api/v1/media/upload",
        params={"file_type": "image", "owner_id": 1},
        files={"file": ("photo.jpg", jpeg, "image/jpeg")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert "storage_key" in data
    assert data["content_type"] == "image/jpeg"
    assert data["size"] == len(jpeg)


@pytest.mark.asyncio
async def test_upload_media_with_pet_id(client: AsyncClient, temp_storage_path) -> None:
    """POST /api/v1/media/upload with pet_id associates media to pet."""
    jpeg = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 100
    resp = await client.post(
        "/api/v1/media/upload",
        params={"file_type": "image", "owner_id": 1, "pet_id": 1},
        files={"file": ("photo.jpg", jpeg, "image/jpeg")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
