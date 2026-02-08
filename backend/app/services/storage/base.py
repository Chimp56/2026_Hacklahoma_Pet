"""Abstract file storage - implement for local or DigitalOcean Spaces."""

from abc import ABC, abstractmethod
from pathlib import Path


class FileStorage(ABC):
    """Store and retrieve files by key. Keys are relative paths/identifiers."""

    @abstractmethod
    def save(self, key: str, data: bytes, content_type: str | None = None) -> str:
        """Save bytes under key. Returns the storage key or public URL (implementation-defined)."""
        ...

    @abstractmethod
    def read(self, key: str) -> bytes:
        """Read file bytes by key. Raises FileNotFoundError if missing."""
        ...

    @abstractmethod
    def delete(self, key: str) -> None:
        """Delete file by key. No-op if missing."""
        ...

    @abstractmethod
    def get_url(self, key: str) -> str | None:
        """Return public or signed URL for the key, or None if not applicable."""
        ...

    def key_for(self, file_type: str, owner_id: int, filename: str) -> str:
        """Generate a stable key: e.g. images/1/uuid-or-filename."""
        import uuid
        ext = Path(filename).suffix or ""
        unique = f"{uuid.uuid4().hex[:12]}{ext}"
        return f"{file_type}s/{owner_id}/{unique}"
