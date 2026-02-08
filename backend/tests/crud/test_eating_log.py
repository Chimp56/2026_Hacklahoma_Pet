"""Tests for eating log CRUD operations."""

from datetime import datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.eating_log import eating_log_crud
from app.crud.pet import pet_crud
from app.crud.user import user_crud
from app.schemas.habits import EatingLogCreate
from app.schemas.pet import PetCreate
from app.schemas.user import UserCreate


@pytest.fixture
async def db_pet(db_session: AsyncSession) -> int:
    """Create a user and pet, return pet_id."""
    user = await user_crud.create(
        db_session,
        obj_in=UserCreate(name="Owner", email="owner@eating.com", password="pass123456"),
    )
    pet = await pet_crud.create(
        db_session,
        obj_in=PetCreate(name="Buddy", species="dog", owner_id=user.id),
    )
    return pet.id


@pytest.mark.asyncio
async def test_eating_log_create(
    db_session: AsyncSession, db_pet: int
) -> None:
    """Create eating log returns log."""
    now = datetime.utcnow()
    obj_in = EatingLogCreate(
        occurred_at=now,
        meal_type="breakfast",
        amount="1 cup",
        notes="Finished bowl",
        source="manual",
    )
    log = await eating_log_crud.create(db_session, pet_id=db_pet, obj_in=obj_in)
    assert log.id is not None
    assert log.pet_id == db_pet
    assert log.meal_type == "breakfast"
    assert log.amount == "1 cup"


@pytest.mark.asyncio
async def test_eating_log_get_multi(
    db_session: AsyncSession, db_pet: int
) -> None:
    """Get multi returns logs with filters."""
    now = datetime.utcnow()
    obj_in = EatingLogCreate(occurred_at=now, meal_type="lunch", source="manual")
    await eating_log_crud.create(db_session, pet_id=db_pet, obj_in=obj_in)
    logs = await eating_log_crud.get_multi(db_session, pet_id=db_pet)
    assert len(logs) >= 1
    logs_dinner = await eating_log_crud.get_multi(
        db_session, pet_id=db_pet, meal_type="dinner"
    )
    assert len(logs_dinner) == 0


@pytest.mark.asyncio
async def test_eating_log_get_multi_since_until(
    db_session: AsyncSession, db_pet: int
) -> None:
    """Get multi with since/until filters."""
    logs = await eating_log_crud.get_multi(
        db_session,
        pet_id=db_pet,
        since=datetime(2020, 1, 1),
        until=datetime(2030, 1, 1),
    )
    assert isinstance(logs, list)
