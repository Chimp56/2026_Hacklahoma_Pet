"""Tests for sleep log CRUD operations."""

from datetime import datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.pet import pet_crud
from app.crud.sleep_log import sleep_log_crud
from app.crud.user import user_crud
from app.schemas.habits import SleepLogCreate
from app.schemas.pet import PetCreate
from app.schemas.user import UserCreate


@pytest.fixture
async def db_pet(db_session: AsyncSession) -> int:
    """Create a user and pet, return pet_id."""
    user = await user_crud.create(
        db_session,
        obj_in=UserCreate(name="Owner", email="owner@sleep.com", password="pass123456"),
    )
    pet = await pet_crud.create(
        db_session,
        obj_in=PetCreate(name="Buddy", species="dog", owner_id=user.id),
    )
    return pet.id


@pytest.mark.asyncio
async def test_sleep_log_create(db_session: AsyncSession, db_pet: int) -> None:
    """Create sleep log returns log."""
    now = datetime.utcnow()
    obj_in = SleepLogCreate(
        started_at=now,
        ended_at=now,
        duration_minutes=60,
        notes="Afternoon nap",
        source="manual",
    )
    log = await sleep_log_crud.create(db_session, pet_id=db_pet, obj_in=obj_in)
    assert log.id is not None
    assert log.pet_id == db_pet
    assert log.duration_minutes == 60


@pytest.mark.asyncio
async def test_sleep_log_create_duration_from_ended(
    db_session: AsyncSession, db_pet: int
) -> None:
    """Create sleep log without duration_minutes computes from ended_at - started_at."""
    start = datetime(2024, 1, 1, 10, 0)
    end = datetime(2024, 1, 1, 11, 30)  # 90 min
    obj_in = SleepLogCreate(started_at=start, ended_at=end, source="manual")
    log = await sleep_log_crud.create(db_session, pet_id=db_pet, obj_in=obj_in)
    assert log.duration_minutes == 90


@pytest.mark.asyncio
async def test_sleep_log_get_multi(db_session: AsyncSession, db_pet: int) -> None:
    """Get multi returns logs."""
    now = datetime.utcnow()
    obj_in = SleepLogCreate(started_at=now, duration_minutes=30, source="manual")
    await sleep_log_crud.create(db_session, pet_id=db_pet, obj_in=obj_in)
    logs = await sleep_log_crud.get_multi(db_session, pet_id=db_pet)
    assert len(logs) >= 1


@pytest.mark.asyncio
async def test_sleep_log_get_multi_since_until(
    db_session: AsyncSession, db_pet: int
) -> None:
    """Get multi with since/until filters."""
    logs = await sleep_log_crud.get_multi(
        db_session,
        pet_id=db_pet,
        since=datetime(2020, 1, 1),
        until=datetime(2030, 1, 1),
    )
    assert isinstance(logs, list)
