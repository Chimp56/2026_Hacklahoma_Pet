"""CRUD for SleepLog."""

from datetime import datetime
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sleep_log import SleepLog
from app.schemas.habits import SleepLogCreate


class CRUDSleepLog:
    """CRUD for SleepLog."""

    async def create(self, db: AsyncSession, *, pet_id: int, obj_in: SleepLogCreate) -> SleepLog:
        log = SleepLog(
            pet_id=pet_id,
            started_at=obj_in.started_at,
            ended_at=obj_in.ended_at,
            duration_minutes=obj_in.duration_minutes,
            notes=obj_in.notes,
            source=obj_in.source,
        )
        if obj_in.ended_at and not obj_in.duration_minutes:
            delta = obj_in.ended_at - obj_in.started_at
            log.duration_minutes = int(delta.total_seconds() / 60)
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
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[SleepLog]:
        q = select(SleepLog).where(SleepLog.pet_id == pet_id)
        if since is not None:
            q = q.where(SleepLog.started_at >= since)
        if until is not None:
            q = q.where(SleepLog.started_at <= until)
        q = q.order_by(SleepLog.started_at.desc()).offset(skip).limit(limit)
        result = await db.execute(q)
        return result.scalars().all()


sleep_log_crud = CRUDSleepLog()
