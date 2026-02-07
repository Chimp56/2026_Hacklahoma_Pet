"""Pet API schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PetBase(BaseModel):
    """Shared fields for Pet."""

    name: str = Field(..., min_length=1, max_length=255)
    species: str = Field(..., min_length=1, max_length=100)
    breed: Optional[str] = Field(None, max_length=100)


class PetCreate(PetBase):
    """Schema for creating a pet."""

    pass


class PetUpdate(BaseModel):
    """Schema for partial update."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    species: Optional[str] = Field(None, min_length=1, max_length=100)
    breed: Optional[str] = Field(None, max_length=100)


class PetResponse(PetBase):
    """Schema for pet in responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
