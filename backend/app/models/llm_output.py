"""LLM output model - store results from Gemini/Llama for images and audio."""

from typing import Any

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class LLMOutput(Base, TimestampMixin):
    """Cached/output from an LLM run: model, task (image/audio), input ref, structured result."""

    __tablename__ = "llm_outputs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    pet_id: Mapped[int | None] = mapped_column(ForeignKey("pets.id", ondelete="SET NULL"), nullable=True, index=True)
    media_file_id: Mapped[int | None] = mapped_column(ForeignKey("media_files.id", ondelete="SET NULL"), nullable=True, index=True)
    model_used: Mapped[str] = mapped_column(String(128), nullable=False)  # gemini-1.5-flash, llama3.2:1b
    task: Mapped[str] = mapped_column(String(32), nullable=False)  # image, audio
    raw_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    structured_result: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    pet: Mapped["Pet | None"] = relationship("Pet", back_populates="llm_outputs")

    def __repr__(self) -> str:
        return f"<LLMOutput(id={self.id}, model={self.model_used!r}, task={self.task!r})>"
