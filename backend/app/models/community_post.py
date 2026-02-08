"""Community post model - user posts with optional pet and media."""

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin


class CommunityPost(Base, TimestampMixin):
    """User post in community feed - text and optional pet/media refs."""

    __tablename__ = "community_posts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    pet_id: Mapped[int | None] = mapped_column(ForeignKey("pets.id", ondelete="SET NULL"), nullable=True, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="posts")
    # Optional: post_media many-to-many or JSON list of media_file_ids; keep simple with content + title

    def __repr__(self) -> str:
        return f"<CommunityPost(id={self.id}, user_id={self.user_id})>"
