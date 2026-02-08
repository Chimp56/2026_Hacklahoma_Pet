"""Milestone model - sleep, food, age, breed, sound, gender detections."""

from datetime import datetime
from typing import Any

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class Milestone(Base, TimestampMixin):
    """Detected or logged milestone: sleep, eating, age, breed, sound, gender."""

    __tablename__ = "milestones"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    pet_id: Mapped[int] = mapped_column(ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True)
    milestone_type: Mapped[str] = mapped_column(String(64), nullable=False)  # sleep, food, age, breed, sound, gender
    value: Mapped[str | None] = mapped_column(String(255), nullable=True)  # e.g. "8 hours", "Golden Retriever"
    detected_at: Mapped[datetime] = mapped_column(nullable=False)
    metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSONB, nullable=True)
    media_file_id: Mapped[int | None] = mapped_column(ForeignKey("media_files.id", ondelete="SET NULL"), nullable=True, index=True)

    pet: Mapped["Pet"] = relationship("Pet", back_populates="milestones")

    def __repr__(self) -> str:
        return f"<Milestone(id={self.id}, type={self.milestone_type!r}, pet_id={self.pet_id})>"
