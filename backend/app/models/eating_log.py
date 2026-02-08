"""Eating log - record when and what a pet (e.g. dog) ate."""

from datetime import datetime

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class EatingLog(Base, TimestampMixin):
    """One eating event: time, meal type, amount, optional notes."""

    __tablename__ = "eating_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    pet_id: Mapped[int] = mapped_column(ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True)
    occurred_at: Mapped[datetime] = mapped_column(nullable=False)
    meal_type: Mapped[str] = mapped_column(String(32), nullable=False)  # breakfast, lunch, dinner, snack
    amount: Mapped[str | None] = mapped_column(String(128), nullable=True)  # e.g. "1 cup", "half bowl"
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="manual")  # manual, camera, device

    pet: Mapped["Pet"] = relationship("Pet", back_populates="eating_logs")

    def __repr__(self) -> str:
        return f"<EatingLog(id={self.id}, pet_id={self.pet_id}, meal_type={self.meal_type!r})>"
