"""Pytest fixtures and configuration."""

import tempfile
from collections.abc import AsyncGenerator
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.db.session import async_session_maker


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    """Override get_db: yield session and rollback instead of commit for test isolation."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.rollback()


@pytest.fixture
def app_with_db_override():
    """App with get_db overridden to rollback after each request (test isolation).
    App is imported lazily here so tests that don't use the client can run without
    loading the full app (e.g. CRUD and non-AI service tests)."""
    from app.main import app
    app.dependency_overrides[get_db] = override_get_db
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
async def client(app_with_db_override) -> AsyncClient:
    """Async HTTP client for testing the app (with DB rollback isolation)."""
    transport = ASGITransport(app=app_with_db_override)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Async DB session for CRUD tests. Rolls back after each test."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.rollback()


@pytest.fixture
def temp_storage_path(monkeypatch: pytest.MonkeyPatch) -> Path:
    """Temporary directory for local storage during tests."""
    tmp = tempfile.mkdtemp()
    monkeypatch.setenv("STORAGE_BACKEND", "local")
    monkeypatch.setenv("STORAGE_LOCAL_PATH", tmp)
    from app.config import get_settings
    from app.services.storage.factory import get_storage
    get_settings.cache_clear()
    get_storage.cache_clear()
    yield Path(tmp)
    get_settings.cache_clear()
    get_storage.cache_clear()
