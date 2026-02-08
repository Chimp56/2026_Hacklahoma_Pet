"""Pet model - profile, breed, milestones."""

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin
from app.models.user_pet import user_pets


class Pet(Base, TimestampMixin):
    """Pet profile - species, breed, age, gender, health. Can belong to multiple users (shared via QR/link)."""

    __tablename__ = "pets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    owner_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    species: Mapped[str] = mapped_column(String(100), nullable=False)
    breed: Mapped[str | None] = mapped_column(String(100), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)  # male, female, unknown
    date_of_birth: Mapped[str | None] = mapped_column(String(20), nullable=True)  # or approximate age string
    health_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    owner: Mapped["User | None"] = relationship("User", back_populates="pets")
    linked_users: Mapped[list["User"]] = relationship(
        "User", secondary=user_pets, back_populates="linked_pets", lazy="selectin"
    )
    activities: Mapped[list["Activity"]] = relationship("Activity", back_populates="pet", lazy="selectin")
    milestones: Mapped[list["Milestone"]] = relationship("Milestone", back_populates="pet", lazy="selectin")
    llm_outputs: Mapped[list["LLMOutput"]] = relationship("LLMOutput", back_populates="pet", lazy="selectin")
    sleep_logs: Mapped[list["SleepLog"]] = relationship("SleepLog", back_populates="pet", lazy="selectin")
    eating_logs: Mapped[list["EatingLog"]] = relationship("EatingLog", back_populates="pet", lazy="selectin")
    vet_visits: Mapped[list["VetVisit"]] = relationship("VetVisit", back_populates="pet", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Pet(id={self.id}, name={self.name!r})>"
