"""Auth API schemas: login and token response."""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Login with email and password."""

    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=1, description="Password")


class TokenResponse(BaseModel):
    """JWT access token returned after login."""

    access_token: str = Field(..., description="JWT bearer token")
    token_type: str = Field(default="bearer", description="Token type")
