"""Local filesystem storage - good for dev; migrate to DO Spaces for production."""

from pathlib import Path

from app.config import get_settings
from app.services.storage.base import FileStorage


class LocalFileStorage(FileStorage):
    """Store files under storage_local_path. Keys are relative paths."""

    def __init__(self) -> None:
        settings = get_settings()
        self.root = Path(settings.storage_local_path).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        p = (self.root / key).resolve()
        if not str(p).startswith(str(self.root)):
            raise ValueError("Invalid key: path escape")
        return p

    def save(self, key: str, data: bytes, content_type: str | None = None) -> str:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return key

    def read(self, key: str) -> bytes:
        path = self._path(key)
        if not path.is_file():
            raise FileNotFoundError(key)
        return path.read_bytes()

    def delete(self, key: str) -> None:
        path = self._path(key)
        if path.is_file():
            path.unlink()

    def get_url(self, key: str) -> str | None:
        """Local storage has no public URL by default; return None or a path for dev."""
        return None
