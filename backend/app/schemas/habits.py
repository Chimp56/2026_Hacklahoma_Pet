"""Schemas for sleep and eating habit logs."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class SleepLogCreate(BaseModel):
    """Create a sleep log entry."""

    started_at: datetime = Field(..., description="When the pet went to sleep")
    ended_at: Optional[datetime] = Field(None, description="When the pet woke up")
    duration_minutes: Optional[int] = Field(None, ge=0, le=1440, description="Duration in minutes (if ended_at not set)")
    notes: Optional[str] = Field(None, max_length=2000)
    source: Literal["manual", "camera", "device"] = "manual"


class SleepLogResponse(BaseModel):
    """Sleep log in API response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    pet_id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    source: str
    created_at: datetime


class EatingLogCreate(BaseModel):
    """Create an eating log entry."""

    occurred_at: datetime = Field(..., description="When the pet ate")
    meal_type: Literal["breakfast", "lunch", "dinner", "snack"] = Field(..., description="Type of meal")
    amount: Optional[str] = Field(None, max_length=128, description="e.g. 1 cup, half bowl")
    notes: Optional[str] = Field(None, max_length=2000)
    source: Literal["manual", "camera", "device"] = "manual"


class EatingLogResponse(BaseModel):
    """Eating log in API response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    pet_id: int
    occurred_at: datetime
    meal_type: str
    amount: Optional[str] = None
    notes: Optional[str] = None
    source: str
    created_at: datetime
