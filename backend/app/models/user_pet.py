"""Association table: users <-> pets (many-to-many). A user can have many pets; a pet can belong to many users."""

from sqlalchemy import ForeignKey, Table, Column

from app.db.base import Base

user_pets = Table(
    "user_pets",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("pet_id", ForeignKey("pets.id", ondelete="CASCADE"), primary_key=True),
)
