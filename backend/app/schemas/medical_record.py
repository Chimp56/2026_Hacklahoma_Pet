"""Schemas for pet medical records (PDF uploads)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MedicalRecordResponse(BaseModel):
    """One pet medical record (PDF) - for list and upload response. url is always an accessible URL to the PDF."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str  # Accessible URL to the PDF (storage public URL or API download URL)
    storage_key: str
    file_size_bytes: int | None
    mime_type: str
    created_at: datetime
