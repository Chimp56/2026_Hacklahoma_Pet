"""Storage factory - returns backend based on config (local or digitalocean)."""

from functools import lru_cache

from app.config import get_settings
from app.services.storage.base import FileStorage
from app.services.storage.digitalocean_storage import DigitalOceanSpacesStorage
from app.services.storage.local_storage import LocalFileStorage


@lru_cache
def get_storage() -> FileStorage:
    """Return configured file storage backend."""
    settings = get_settings()
    if settings.storage_backend == "digitalocean":
        return DigitalOceanSpacesStorage()
    return LocalFileStorage()
