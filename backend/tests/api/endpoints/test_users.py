"""Tests for users API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.fixture
async def created_user(client: AsyncClient) -> dict:
    """Create a user via API and return response data."""
    body = {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "securepass123",
        "display_name": "Test",
    }
    resp = await client.post("/api/v1/users", json=body)
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_list_users_empty(client: AsyncClient) -> None:
    """GET /api/v1/users returns empty list when no users."""
    resp = await client.get("/api/v1/users")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_create_user(client: AsyncClient) -> None:
    """POST /api/v1/users creates a user."""
    body = {
        "name": "Alice",
        "email": "alice@example.com",
        "password": "password123",
    }
    resp = await client.post("/api/v1/users", json=body)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Alice"
    assert data["email"] == "alice@example.com"
    assert "password" not in data
    assert "hashed_password" not in data
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_create_user_duplicate_email(client: AsyncClient, created_user: dict) -> None:
    """POST /api/v1/users with existing email returns 409."""
    body = {
        "name": "Other",
        "email": created_user["email"],
        "password": "otherpass123",
    }
    resp = await client.post("/api/v1/users", json=body)
    assert resp.status_code == 409
    assert "already registered" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_user(client: AsyncClient, created_user: dict) -> None:
    """GET /api/v1/users/{id} returns user."""
    resp = await client.get(f"/api/v1/users/{created_user['id']}")
    assert resp.status_code == 200
    assert resp.json()["email"] == created_user["email"]


@pytest.mark.asyncio
async def test_get_user_not_found(client: AsyncClient) -> None:
    """GET /api/v1/users/{id} returns 404 for unknown id."""
    resp = await client.get("/api/v1/users/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_user(client: AsyncClient, created_user: dict) -> None:
    """PATCH /api/v1/users/{id} updates user."""
    resp = await client.patch(
        f"/api/v1/users/{created_user['id']}",
        json={"name": "Updated Name", "display_name": "Updated"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Updated Name"
    assert data["display_name"] == "Updated"


@pytest.mark.asyncio
async def test_update_user_not_found(client: AsyncClient) -> None:
    """PATCH /api/v1/users/{id} returns 404 for unknown id."""
    resp = await client.patch("/api/v1/users/99999", json={"name": "X"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_user(client: AsyncClient, created_user: dict) -> None:
    """DELETE /api/v1/users/{id} removes user."""
    resp = await client.delete(f"/api/v1/users/{created_user['id']}")
    assert resp.status_code == 204
    get_resp = await client.get(f"/api/v1/users/{created_user['id']}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_user_not_found(client: AsyncClient) -> None:
    """DELETE /api/v1/users/{id} returns 404 for unknown id."""
    resp = await client.delete("/api/v1/users/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_users_pagination(client: AsyncClient, created_user: dict) -> None:
    """GET /api/v1/users with skip/limit."""
    resp = await client.get("/api/v1/users?skip=0&limit=10")
    assert resp.status_code == 200
    users = resp.json()
    assert len(users) >= 1
    resp2 = await client.get("/api/v1/users?skip=10&limit=5")
    assert resp2.status_code == 200


@pytest.mark.asyncio
async def test_list_user_pets_empty(client: AsyncClient, created_user: dict) -> None:
    """GET /api/v1/users/{id}/pets returns empty when user has no linked pets."""
    resp = await client.get(f"/api/v1/users/{created_user['id']}/pets")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_list_user_pets_not_found(client: AsyncClient) -> None:
    """GET /api/v1/users/{id}/pets returns 404 for unknown user."""
    resp = await client.get("/api/v1/users/99999/pets")
    assert resp.status_code == 404
