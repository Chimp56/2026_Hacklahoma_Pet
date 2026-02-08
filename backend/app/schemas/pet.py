"""Pet API schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PetBase(BaseModel):
    """Shared fields for Pet."""

    name: str = Field(..., min_length=1, max_length=255)
    species: str = Field(..., min_length=1, max_length=100)
    breed: Optional[str] = Field(None, max_length=100)
    gender: Optional[str] = Field(None, max_length=20, description="e.g. male, female, unknown")
    date_of_birth: Optional[str] = Field(None, max_length=20, description="YYYY-MM-DD or approximate age string")
    weight: Optional[float] = Field(None, description="Weight in lbs")
    health_notes: Optional[str] = Field(None, description="Allergies, conditions, vet notes, etc.")


class PetCreate(PetBase):
    """Schema for creating a pet. All fields except name/species are optional."""

    owner_id: Optional[int] = Field(None, description="Primary owner user id (from auth when available)")


class PetUpdate(BaseModel):
    """Schema for partial update."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    species: Optional[str] = Field(None, min_length=1, max_length=100)
    breed: Optional[str] = Field(None, max_length=100)
    gender: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[str] = Field(None, max_length=20)
    weight: Optional[float] = Field(None)
    health_notes: Optional[str] = Field(None)


class PetResponse(PetBase):
    """Schema for pet in responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    profile_photo_url: Optional[str] = Field(None, description="URL to pet's profile picture (latest uploaded image)")
