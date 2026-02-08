"""Sleep log - record when and how long a pet (e.g. dog) slept."""

from datetime import datetime

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class SleepLog(Base, TimestampMixin):
    """One sleep session: start, end or duration, optional notes."""

    __tablename__ = "sleep_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    pet_id: Mapped[int] = mapped_column(ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="manual")  # manual, camera, device

    pet: Mapped["Pet"] = relationship("Pet", back_populates="sleep_logs")

    def __repr__(self) -> str:
        return f"<SleepLog(id={self.id}, pet_id={self.pet_id}, started_at={self.started_at})>"
