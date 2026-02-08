"""Activity model - RTSP/camera events, uploads, tracking."""

from datetime import datetime
from typing import Any

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class Activity(Base, TimestampMixin):
    """Single activity event: stream snapshot, upload, motion, etc."""

    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    pet_id: Mapped[int] = mapped_column(ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type: Mapped[str] = mapped_column(String(64), nullable=False)  # rtsp_snapshot, upload, motion, eating, sleep
    source: Mapped[str] = mapped_column(String(64), nullable=False)  # rtsp, camera, upload, manual
    occurred_at: Mapped[datetime] = mapped_column(nullable=False)
    metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSONB, nullable=True)  # rtsp_url, duration, etc.
    media_file_id: Mapped[int | None] = mapped_column(ForeignKey("media_files.id", ondelete="SET NULL"), nullable=True, index=True)

    pet: Mapped["Pet"] = relationship("Pet", back_populates="activities")
    media_file: Mapped["MediaFile | None"] = relationship("MediaFile", back_populates="activities", foreign_keys=[media_file_id])

    def __repr__(self) -> str:
        return f"<Activity(id={self.id}, type={self.activity_type!r}, pet_id={self.pet_id})>"
