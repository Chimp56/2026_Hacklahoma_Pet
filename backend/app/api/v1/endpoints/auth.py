"""Auth endpoints: login and current user."""

from fastapi import APIRouter, HTTPException, status

from app.core.dependencies import CurrentUser, DbSession
from app.core.security import create_access_token, verify_password
from app.crud.user import user_crud
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(db: DbSession, body: LoginRequest) -> TokenResponse:
    """
    Login with email and password. Returns a JWT access token.
    Use the token in the Authorization header: `Bearer <access_token>`.
    """
    user = await user_crud.get_by_email(db, email=body.email)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(subject=user.id)
    return TokenResponse(access_token=token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser) -> UserResponse:
    """Return the currently authenticated user. Requires Bearer token."""
    return current_user
