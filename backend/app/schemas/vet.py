"""Vet (veterinarian) API schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class VetBase(BaseModel):
    """Shared fields for Vet."""

    name: str = Field(..., min_length=1, max_length=255)
    clinic_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=64)
    address: Optional[str] = Field(None)


class VetCreate(VetBase):
    """Schema for creating a vet."""

    owner_id: Optional[int] = Field(None, description="User id who owns this vet (from auth when available)")


class VetUpdate(BaseModel):
    """Schema for partial update."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    clinic_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=64)
    address: Optional[str] = Field(None)


class VetResponse(VetBase):
    """Schema for vet in responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
