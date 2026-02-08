"""CRUD for ActivityStateLog."""

from datetime import datetime, timezone
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_state_log import ActivityStateLog
from app.schemas.habits import ActivityStateLogCreate


def _naive_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc)
    return dt.replace(tzinfo=None)


class CRUDActivityStateLog:
    """CRUD for ActivityStateLog."""

    async def create(
        self, db: AsyncSession, *, pet_id: int, obj_in: ActivityStateLogCreate
    ) -> ActivityStateLog:
        start_time = _naive_utc(obj_in.start_time) or _naive_utc(datetime.now(timezone.utc))
        log = ActivityStateLog(pet_id=pet_id, active=obj_in.active, start_time=start_time)
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
        limit: int = 500,
    ) -> Sequence[ActivityStateLog]:
        since_naive = _naive_utc(since)
        until_naive = _naive_utc(until)
        q = select(ActivityStateLog).where(ActivityStateLog.pet_id == pet_id)
        if since_naive is not None:
            q = q.where(ActivityStateLog.start_time >= since_naive)
        if until_naive is not None:
            q = q.where(ActivityStateLog.start_time <= until_naive)
        q = q.order_by(ActivityStateLog.start_time.desc()).offset(skip).limit(limit)
        result = await db.execute(q)
        return result.scalars().all()


activity_state_log_crud = CRUDActivityStateLog()
