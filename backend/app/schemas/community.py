"""Community post API schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CommunityPostBase(BaseModel):
    """Shared fields for community post."""

    content: str = Field(..., min_length=1, description="Post body text")
    title: Optional[str] = Field(None, max_length=255)
    pet_id: Optional[int] = Field(None, description="Optional pet this post is about")


class CommunityPostCreate(CommunityPostBase):
    """Schema for creating a post. user_id set from auth."""

    pass


class CommunityPostUpdate(BaseModel):
    """Schema for partial update."""

    content: Optional[str] = Field(None, min_length=1)
    title: Optional[str] = Field(None, max_length=255)
    pet_id: Optional[int] = None


class CommunityPostResponse(CommunityPostBase):
    """Schema for post in responses; includes user and pet display info."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    user_name: Optional[str] = None  # Populated from relationship or select
    pet_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
