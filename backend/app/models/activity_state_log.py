"""Activity state log - record when a pet transitions between active and resting."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class ActivityStateLog(Base, TimestampMixin):
    """One activity state change: active (True) or resting (False) at start_time."""

    __tablename__ = "activity_state_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    pet_id: Mapped[int] = mapped_column(ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    pet: Mapped["Pet"] = relationship("Pet", back_populates="activity_state_logs")

    def __repr__(self) -> str:
        return f"<ActivityStateLog(id={self.id}, pet_id={self.pet_id}, active={self.active}, start_time={self.start_time})>"
