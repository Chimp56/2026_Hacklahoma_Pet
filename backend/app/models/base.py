"""Base mixins for models."""

from datetime import datetime
from typing import Annotated

from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column

# Type alias for datetime with server default
timestamp = Annotated[
    datetime,
    mapped_column(nullable=False, server_default=func.now()),
]


class TimestampMixin:
    """Created/updated timestamps."""

    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now(), onupdate=func.now())
