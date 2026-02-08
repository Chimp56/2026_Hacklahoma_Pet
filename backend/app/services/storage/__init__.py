"""File storage - local and DigitalOcean Spaces."""

from app.services.storage.base import FileStorage
from app.services.storage.factory import get_storage

__all__ = ["FileStorage", "get_storage"]
