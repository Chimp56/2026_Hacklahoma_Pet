"""Users API endpoints."""

from fastapi import APIRouter, HTTPException, Query

from app.core.dependencies import DbSession
from app.crud.user import user_crud
from app.models.user import User
from app.schemas.pet import PetResponse
from app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
async def list_users(
    db: DbSession,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> list[UserResponse]:
    """List users with pagination."""
    users = await user_crud.get_multi(db, skip=skip, limit=limit)
    return list(users)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(db: DbSession, user_id: int) -> UserResponse:
    """Get a user by id."""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(db: DbSession, body: UserCreate) -> UserResponse:
    """Create a new user (e.g. registration). Email must be unique."""
    existing = await user_crud.get_by_email(db, email=body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    return await user_crud.create(db, obj_in=body)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(db: DbSession, user_id: int, body: UserUpdate) -> UserResponse:
    """Update a user. If email is changed, it must remain unique."""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.email is not None and body.email != user.email:
        existing = await user_crud.get_by_email(db, email=body.email)
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
    return await user_crud.update(db, db_obj=user, obj_in=body)


@router.delete("/{user_id}", status_code=204)
async def delete_user(db: DbSession, user_id: int) -> None:
    """Delete a user."""
    deleted = await user_crud.delete(db, id=user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")


@router.get("/{user_id}/pets", response_model=list[PetResponse])
async def list_user_pets(db: DbSession, user_id: int) -> list[PetResponse]:
    """List all pets linked to this user (owned + shared via QR/link). A user can have 0 or more pets."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return list(user.linked_pets)
