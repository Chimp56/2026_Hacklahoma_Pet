"""Vet model - veterinarian or clinic for veterinary care."""

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class Vet(Base, TimestampMixin):
    """Veterinarian or clinic. Can be scoped to owner (owner_id) or shared."""

    __tablename__ = "vets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    owner_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    clinic_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    visits: Mapped[list["VetVisit"]] = relationship("VetVisit", back_populates="vet", lazy="selectin")
