"""User model - name, email, password; user can have many pets (owned + shared)."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin
from app.models.user_pet import user_pets


class User(Base, TimestampMixin):
    """User account: name, email, password (hashed). A user can have many pets (owned or shared)."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    slack_webhook_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    slack_channel: Mapped[str | None] = mapped_column(String(128), nullable=True)

    # Pets this user owns (primary owner via Pet.owner_id)
    pets: Mapped[list["Pet"]] = relationship("Pet", back_populates="owner", lazy="selectin")
    # All pets this user has access to (owned + shared via QR/link)
    linked_pets: Mapped[list["Pet"]] = relationship(
        "Pet", secondary=user_pets, back_populates="linked_users", lazy="selectin"
    )
    posts: Mapped[list["CommunityPost"]] = relationship("CommunityPost", back_populates="user", lazy="selectin")
    media_files: Mapped[list["MediaFile"]] = relationship("MediaFile", back_populates="owner", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email!r})>"
