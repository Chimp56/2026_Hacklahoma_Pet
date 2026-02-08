"""User API schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Shared fields for User."""

    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    display_name: Optional[str] = Field(None, max_length=255)
    slack_webhook_url: Optional[str] = Field(None, max_length=512)
    slack_channel: Optional[str] = Field(None, max_length=128)


class UserCreate(UserBase):
    """Schema for creating a user (e.g. registration)."""

    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(BaseModel):
    """Schema for partial update. Password is hashed if provided."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8, max_length=128)
    display_name: Optional[str] = Field(None, max_length=255)
    slack_webhook_url: Optional[str] = Field(None, max_length=512)
    slack_channel: Optional[str] = Field(None, max_length=128)


class UserResponse(UserBase):
    """Schema for user in responses (no password)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
