"""CRUD for EatingLog."""

from datetime import datetime
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.eating_log import EatingLog
from app.schemas.habits import EatingLogCreate


class CRUDEatingLog:
    """CRUD for EatingLog."""

    async def create(self, db: AsyncSession, *, pet_id: int, obj_in: EatingLogCreate) -> EatingLog:
        log = EatingLog(
            pet_id=pet_id,
            occurred_at=obj_in.occurred_at,
            meal_type=obj_in.meal_type,
            amount=obj_in.amount,
            notes=obj_in.notes,
            source=obj_in.source,
        )
        db.add(log)
        await db.flush()
        await db.refresh(log)
        return log

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        pet_id: int,
        since: datetime | None = None,
        until: datetime | None = None,
        meal_type: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[EatingLog]:
        q = select(EatingLog).where(EatingLog.pet_id == pet_id)
        if since is not None:
            q = q.where(EatingLog.occurred_at >= since)
        if until is not None:
            q = q.where(EatingLog.occurred_at <= until)
        if meal_type is not None:
            q = q.where(EatingLog.meal_type == meal_type)
        q = q.order_by(EatingLog.occurred_at.desc()).offset(skip).limit(limit)
        result = await db.execute(q)
        return result.scalars().all()


eating_log_crud = CRUDEatingLog()
