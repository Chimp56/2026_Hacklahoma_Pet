"""Vet visit model - single veterinary visit for a pet."""

from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class VetVisit(Base, TimestampMixin):
    """Record of a vet visit: date, reason, concerns, activity. Can link to a vet and to medical record docs."""

    __tablename__ = "vet_visits"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    pet_id: Mapped[int] = mapped_column(ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True)
    vet_id: Mapped[int | None] = mapped_column(ForeignKey("vets.id", ondelete="SET NULL"), nullable=True, index=True)
    visit_date: Mapped[date] = mapped_column(Date, nullable=False)
    visit_reason: Mapped[str] = mapped_column(String(512), nullable=False)
    concerns: Mapped[str | None] = mapped_column(Text, nullable=True)
    activity: Mapped[str | None] = mapped_column(Text, nullable=True)

    pet: Mapped["Pet"] = relationship("Pet", back_populates="vet_visits")
    vet: Mapped["Vet | None"] = relationship("Vet", back_populates="visits")
    medical_records: Mapped[list["MediaFile"]] = relationship(
        "MediaFile", back_populates="vet_visit", foreign_keys="MediaFile.vet_visit_id", lazy="selectin"
    )
