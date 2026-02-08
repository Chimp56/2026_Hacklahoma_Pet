"""Media file model - metadata only. File content is in file storage (local or DO Spaces), never in Postgres."""

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class MediaFile(Base, TimestampMixin):
    """Metadata for a stored file (image, audio, video). Content lives in file storage; only storage_key is stored here."""

    __tablename__ = "media_files"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    pet_id: Mapped[int | None] = mapped_column(ForeignKey("pets.id", ondelete="SET NULL"), nullable=True, index=True)
    file_type: Mapped[str] = mapped_column(String(32), nullable=False)  # image, audio, video
    mime_type: Mapped[str] = mapped_column(String(128), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)  # relative path or DO key
    storage_backend: Mapped[str] = mapped_column(String(32), nullable=False, default="local")  # local, digitalocean
    file_size_bytes: Mapped[int | None] = mapped_column(nullable=True)

    owner: Mapped["User"] = relationship("User", back_populates="media_files")
    activities: Mapped[list["Activity"]] = relationship(
        "Activity", back_populates="media_file", foreign_keys="Activity.media_file_id"
    )
