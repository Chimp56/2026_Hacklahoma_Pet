"""Tests for user CRUD operations."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.user import user_crud
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


@pytest.fixture
async def sample_user_create() -> UserCreate:
    """Sample UserCreate schema."""
    return UserCreate(
        name="Test User",
        email="test@example.com",
        password="securepass123",
        display_name="Test",
    )


@pytest.mark.asyncio
async def test_user_create(db_session: AsyncSession, sample_user_create: UserCreate) -> None:
    """Create user hashes password and returns user."""
    user = await user_crud.create(db_session, obj_in=sample_user_create)
    assert user.id is not None
    assert user.name == sample_user_create.name
    assert user.email == sample_user_create.email
    assert user.hashed_password != sample_user_create.password
    assert user.display_name == sample_user_create.display_name


@pytest.mark.asyncio
async def test_user_get(db_session: AsyncSession, sample_user_create: UserCreate) -> None:
    """Get user by id returns created user."""
    created = await user_crud.create(db_session, obj_in=sample_user_create)
    user = await user_crud.get(db_session, id=created.id)
    assert user is not None
    assert user.id == created.id
    assert user.email == sample_user_create.email


@pytest.mark.asyncio
async def test_user_get_not_found(db_session: AsyncSession) -> None:
    """Get user by unknown id returns None."""
    user = await user_crud.get(db_session, id=99999)
    assert user is None


@pytest.mark.asyncio
async def test_user_get_by_email(db_session: AsyncSession, sample_user_create: UserCreate) -> None:
    """Get user by email returns user."""
    await user_crud.create(db_session, obj_in=sample_user_create)
    user = await user_crud.get_by_email(db_session, email=sample_user_create.email)
    assert user is not None
    assert user.email == sample_user_create.email


@pytest.mark.asyncio
async def test_user_get_multi(db_session: AsyncSession, sample_user_create: UserCreate) -> None:
    """Get multi returns users with pagination."""
    await user_crud.create(db_session, obj_in=sample_user_create)
    users = await user_crud.get_multi(db_session, skip=0, limit=10)
    assert len(users) >= 1
    users_skip = await user_crud.get_multi(db_session, skip=100, limit=10)
    assert len(users_skip) == 0


@pytest.mark.asyncio
async def test_user_update(db_session: AsyncSession, sample_user_create: UserCreate) -> None:
    """Update user modifies fields."""
    created = await user_crud.create(db_session, obj_in=sample_user_create)
    update_data = UserUpdate(name="Updated Name", display_name="Updated")
    updated = await user_crud.update(db_session, db_obj=created, obj_in=update_data)
    assert updated.name == "Updated Name"
    assert updated.display_name == "Updated"
    assert updated.email == sample_user_create.email


@pytest.mark.asyncio
async def test_user_update_password(db_session: AsyncSession, sample_user_create: UserCreate) -> None:
    """Update with password hashes new password."""
    created = await user_crud.create(db_session, obj_in=sample_user_create)
    old_hash = created.hashed_password
    update_data = UserUpdate(password="newpassword123")
    updated = await user_crud.update(db_session, db_obj=created, obj_in=update_data)
    assert updated.hashed_password != old_hash
    assert updated.hashed_password != "newpassword123"


@pytest.mark.asyncio
async def test_user_delete(db_session: AsyncSession, sample_user_create: UserCreate) -> None:
    """Delete user removes from db."""
    created = await user_crud.create(db_session, obj_in=sample_user_create)
    deleted = await user_crud.delete(db_session, id=created.id)
    assert deleted is True
    user = await user_crud.get(db_session, id=created.id)
    assert user is None


@pytest.mark.asyncio
async def test_user_delete_not_found(db_session: AsyncSession) -> None:
    """Delete unknown user returns False."""
    deleted = await user_crud.delete(db_session, id=99999)
    assert deleted is False
