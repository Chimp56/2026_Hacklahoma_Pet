"""Tests for pet CRUD operations."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.pet import pet_crud
from app.crud.user import user_crud
from app.models.user import User
from app.schemas.pet import PetCreate, PetUpdate
from app.schemas.user import UserCreate


@pytest.fixture
async def db_user(db_session: AsyncSession) -> User:
    """Create a user in DB for pet ownership."""
    user = await user_crud.create(
        db_session,
        obj_in=UserCreate(name="Owner", email="owner@test.com", password="pass123456"),
    )
    return user


@pytest.fixture
async def sample_pet_create(db_user: User) -> PetCreate:
    """Sample PetCreate schema."""
    return PetCreate(
        name="Rex",
        species="dog",
        breed="Labrador",
        gender="male",
        date_of_birth="2020-01-15",
        health_notes="Allergies: chicken",
        owner_id=db_user.id,
    )


@pytest.mark.asyncio
async def test_pet_create(
    db_session: AsyncSession, sample_pet_create: PetCreate, db_user: User
) -> None:
    """Create pet returns pet with correct fields."""
    pet = await pet_crud.create(db_session, obj_in=sample_pet_create)
    assert pet.id is not None
    assert pet.name == sample_pet_create.name
    assert pet.species == sample_pet_create.species
    assert pet.breed == sample_pet_create.breed
    assert pet.owner_id == db_user.id


@pytest.mark.asyncio
async def test_pet_get(db_session: AsyncSession, sample_pet_create: PetCreate) -> None:
    """Get pet by id returns created pet."""
    created = await pet_crud.create(db_session, obj_in=sample_pet_create)
    pet = await pet_crud.get(db_session, id=created.id)
    assert pet is not None
    assert pet.id == created.id


@pytest.mark.asyncio
async def test_pet_get_not_found(db_session: AsyncSession) -> None:
    """Get pet by unknown id returns None."""
    pet = await pet_crud.get(db_session, id=99999)
    assert pet is None


@pytest.mark.asyncio
async def test_pet_get_multi(db_session: AsyncSession, sample_pet_create: PetCreate) -> None:
    """Get multi returns pets with pagination."""
    await pet_crud.create(db_session, obj_in=sample_pet_create)
    pets = await pet_crud.get_multi(db_session, skip=0, limit=10)
    assert len(pets) >= 1


@pytest.mark.asyncio
async def test_pet_update(db_session: AsyncSession, sample_pet_create: PetCreate) -> None:
    """Update pet modifies fields."""
    created = await pet_crud.create(db_session, obj_in=sample_pet_create)
    update_data = PetUpdate(name="Rex Jr", breed="Labrador Mix")
    updated = await pet_crud.update(db_session, db_obj=created, obj_in=update_data)
    assert updated.name == "Rex Jr"
    assert updated.breed == "Labrador Mix"


@pytest.mark.asyncio
async def test_pet_delete(db_session: AsyncSession, sample_pet_create: PetCreate) -> None:
    """Delete pet removes from db."""
    created = await pet_crud.create(db_session, obj_in=sample_pet_create)
    deleted = await pet_crud.delete(db_session, id=created.id)
    assert deleted is True
    pet = await pet_crud.get(db_session, id=created.id)
    assert pet is None


@pytest.mark.asyncio
async def test_pet_delete_not_found(db_session: AsyncSession) -> None:
    """Delete unknown pet returns False."""
    deleted = await pet_crud.delete(db_session, id=99999)
    assert deleted is False
