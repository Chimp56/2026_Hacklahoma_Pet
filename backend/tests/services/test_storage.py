"""Tests for storage services."""

import tempfile
from pathlib import Path

import pytest

from app.services.storage.local_storage import LocalFileStorage


@pytest.fixture
def temp_dir() -> Path:
    """Temporary directory for local storage."""
    return Path(tempfile.mkdtemp())


@pytest.fixture
def local_storage(temp_dir: Path, monkeypatch: pytest.MonkeyPatch) -> LocalFileStorage:
    """LocalFileStorage with temp directory."""
    monkeypatch.setenv("STORAGE_LOCAL_PATH", str(temp_dir))
    from app.config import get_settings
    from app.services.storage.factory import get_storage
    get_settings.cache_clear()
    get_storage.cache_clear()
    storage = LocalFileStorage()
    yield storage
    get_settings.cache_clear()
    get_storage.cache_clear()


def test_local_storage_save_and_read(local_storage: LocalFileStorage) -> None:
    """Save and read file."""
    key = local_storage.key_for("image", 1, "photo.jpg")
    data = b"fake image content"
    result = local_storage.save(key, data, content_type="image/jpeg")
    assert result == key
    read_data = local_storage.read(key)
    assert read_data == data


def test_local_storage_read_not_found(local_storage: LocalFileStorage) -> None:
    """Read non-existent key raises FileNotFoundError."""
    with pytest.raises(FileNotFoundError):
        local_storage.read("nonexistent/key")


def test_local_storage_delete(local_storage: LocalFileStorage) -> None:
    """Delete removes file."""
    key = local_storage.key_for("image", 1, "photo.jpg")
    local_storage.save(key, b"data")
    local_storage.delete(key)
    with pytest.raises(FileNotFoundError):
        local_storage.read(key)


def test_local_storage_get_url(local_storage: LocalFileStorage) -> None:
    """Local storage get_url returns None."""
    key = local_storage.key_for("image", 1, "photo.jpg")
    url = local_storage.get_url(key)
    assert url is None


def test_local_storage_key_for_format(local_storage: LocalFileStorage) -> None:
    """key_for produces consistent format."""
    key = local_storage.key_for("image", 42, "myphoto.jpg")
    assert key.startswith("images/42/")
    assert key.endswith(".jpg")
    assert len(key) > 20
