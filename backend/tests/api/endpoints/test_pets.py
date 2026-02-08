"""Tests for pets API endpoints."""

from datetime import datetime

import pytest
from httpx import AsyncClient


@pytest.fixture
async def created_user(client: AsyncClient) -> dict:
    """Create a user via API."""
    resp = await client.post(
        "/api/v1/users",
        json={"name": "Owner", "email": "owner@example.com", "password": "pass123456"},
    )
    assert resp.status_code == 201
    return resp.json()


@pytest.fixture
async def created_pet(client: AsyncClient, created_user: dict) -> dict:
    """Create a pet via API."""
    resp = await client.post(
        "/api/v1/pets",
        json={
            "name": "Buddy",
            "species": "dog",
            "breed": "Golden Retriever",
            "owner_id": created_user["id"],
        },
    )
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_list_pets_empty(client: AsyncClient) -> None:
    """GET /api/v1/pets returns empty list when no pets."""
    resp = await client.get("/api/v1/pets")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_create_pet(client: AsyncClient, created_user: dict) -> None:
    """POST /api/v1/pets creates a pet."""
    resp = await client.post(
        "/api/v1/pets",
        json={
            "name": "Rex",
            "species": "dog",
            "breed": "Labrador",
            "owner_id": created_user["id"],
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Rex"
    assert data["species"] == "dog"
    assert data["breed"] == "Labrador"
    assert data["owner_id"] == created_user["id"]
    assert "id" in data


@pytest.mark.asyncio
async def test_get_pet(client: AsyncClient, created_pet: dict) -> None:
    """GET /api/v1/pets/{id} returns pet."""
    resp = await client.get(f"/api/v1/pets/{created_pet['id']}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Buddy"


@pytest.mark.asyncio
async def test_get_pet_not_found(client: AsyncClient) -> None:
    """GET /api/v1/pets/{id} returns 404 for unknown id."""
    resp = await client.get("/api/v1/pets/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_pet(client: AsyncClient, created_pet: dict) -> None:
    """PATCH /api/v1/pets/{id} updates pet."""
    resp = await client.patch(
        f"/api/v1/pets/{created_pet['id']}",
        json={"name": "Buddy Jr", "breed": "Golden Retriever Mix"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Buddy Jr"


@pytest.mark.asyncio
async def test_delete_pet(client: AsyncClient, created_pet: dict) -> None:
    """DELETE /api/v1/pets/{id} removes pet."""
    resp = await client.delete(f"/api/v1/pets/{created_pet['id']}")
    assert resp.status_code == 204
    get_resp = await client.get(f"/api/v1/pets/{created_pet['id']}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_add_pet_to_account(client: AsyncClient, created_pet: dict, created_user: dict) -> None:
    """POST /api/v1/pets/{id}/add-to-account links pet to user."""
    # Create second user
    u2 = await client.post(
        "/api/v1/users",
        json={"name": "User2", "email": "user2@example.com", "password": "pass123456"},
    )
    assert u2.status_code == 201
    user2_id = u2.json()["id"]

    resp = await client.post(
        f"/api/v1/pets/{created_pet['id']}/add-to-account",
        params={"user_id": user2_id},
    )
    assert resp.status_code == 201
    assert resp.json()["id"] == created_pet["id"]


@pytest.mark.asyncio
async def test_add_pet_to_account_idempotent(client: AsyncClient, created_pet: dict, created_user: dict) -> None:
    """Adding pet already linked returns 200 with pet."""
    resp = await client.post(
        f"/api/v1/pets/{created_pet['id']}/add-to-account",
        params={"user_id": created_user["id"]},
    )
    # Owner is linked via create; idempotent add returns pet (200 or 201)
    assert resp.status_code in (200, 201)
    assert resp.json()["id"] == created_pet["id"]


@pytest.mark.asyncio
async def test_list_user_pets_after_add(client: AsyncClient, created_pet: dict, created_user: dict) -> None:
    """User sees linked pet in GET /users/{id}/pets."""
    resp = await client.get(f"/api/v1/users/{created_user['id']}/pets")
    assert resp.status_code == 200
    pets = resp.json()
    assert len(pets) >= 1
    ids = [p["id"] for p in pets]
    assert created_pet["id"] in ids


@pytest.mark.asyncio
async def test_get_pet_qr_code_share(client: AsyncClient, created_pet: dict) -> None:
    """GET /api/v1/pets/{id}/qr-code/share returns PNG."""
    resp = await client.get(f"/api/v1/pets/{created_pet['id']}/qr-code/share")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"
    assert len(resp.content) > 100


@pytest.mark.asyncio
async def test_get_pet_qr_code(client: AsyncClient, created_pet: dict) -> None:
    """GET /api/v1/pets/{id}/qr-code returns PNG."""
    resp = await client.get(f"/api/v1/pets/{created_pet['id']}/qr-code")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"


@pytest.mark.asyncio
async def test_list_sleep_logs(client: AsyncClient, created_pet: dict) -> None:
    """GET /api/v1/pets/{id}/sleep-logs returns list."""
    resp = await client.get(f"/api/v1/pets/{created_pet['id']}/sleep-logs")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_create_sleep_log(client: AsyncClient, created_pet: dict) -> None:
    """POST /api/v1/pets/{id}/sleep-logs creates log."""
    now = datetime.utcnow()
    body = {
        "started_at": now.isoformat(),
        "ended_at": now.isoformat(),
        "duration_minutes": 60,
        "notes": "Nap",
        "source": "manual",
    }
    resp = await client.post(f"/api/v1/pets/{created_pet['id']}/sleep-logs", json=body)
    assert resp.status_code == 201
    data = resp.json()
    assert data["pet_id"] == created_pet["id"]
    assert data["duration_minutes"] == 60


@pytest.mark.asyncio
async def test_list_eating_logs(client: AsyncClient, created_pet: dict) -> None:
    """GET /api/v1/pets/{id}/eating-logs returns list."""
    resp = await client.get(f"/api/v1/pets/{created_pet['id']}/eating-logs")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_create_eating_log(client: AsyncClient, created_pet: dict) -> None:
    """POST /api/v1/pets/{id}/eating-logs creates log."""
    now = datetime.utcnow()
    body = {
        "occurred_at": now.isoformat(),
        "meal_type": "breakfast",
        "amount": "1 cup",
        "notes": "Finished bowl",
        "source": "manual",
    }
    resp = await client.post(f"/api/v1/pets/{created_pet['id']}/eating-logs", json=body)
    assert resp.status_code == 201
    data = resp.json()
    assert data["pet_id"] == created_pet["id"]
    assert data["meal_type"] == "breakfast"


@pytest.mark.asyncio
async def test_list_medical_records_empty(client: AsyncClient, created_pet: dict) -> None:
    """GET /api/v1/pets/{id}/medical-records returns empty when none."""
    resp = await client.get(f"/api/v1/pets/{created_pet['id']}/medical-records")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_get_latest_medical_record_not_found(client: AsyncClient, created_pet: dict) -> None:
    """GET /api/v1/pets/{id}/medical-records/latest returns 404 when none."""
    resp = await client.get(f"/api/v1/pets/{created_pet['id']}/medical-records/latest")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_upload_medical_record(client: AsyncClient, created_pet: dict, created_user: dict) -> None:
    """POST /api/v1/pets/{id}/medical-records uploads PDF."""
    pdf_content = b"%PDF-1.4 fake pdf content for test"
    files = {"file": ("medical.pdf", pdf_content, "application/pdf")}
    resp = await client.post(
        f"/api/v1/pets/{created_pet['id']}/medical-records",
        params={"owner_id": created_user["id"]},
        files=files,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data
    assert "url" in data
    assert data["mime_type"] == "application/pdf"
