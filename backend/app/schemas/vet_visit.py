"""Vet visit API schemas."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class VetVisitBase(BaseModel):
    """Shared fields for VetVisit."""

    visit_date: date
    visit_reason: str = Field(..., min_length=1, max_length=512)
    concerns: Optional[str] = Field(None)
    activity: Optional[str] = Field(None)


class VetVisitCreate(VetVisitBase):
    """Schema for creating a vet visit."""

    vet_id: Optional[int] = Field(None, description="Vet id if visit was at a known vet")


class VetVisitUpdate(BaseModel):
    """Schema for partial update."""

    visit_date: Optional[date] = None
    visit_reason: Optional[str] = Field(None, min_length=1, max_length=512)
    vet_id: Optional[int] = None
    concerns: Optional[str] = Field(None)
    activity: Optional[str] = Field(None)


class VetVisitResponse(VetVisitBase):
    """Schema for vet visit in responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    pet_id: int
    vet_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
