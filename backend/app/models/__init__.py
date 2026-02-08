"""ORM models - import all so Alembic can discover them."""

from app.models.activity import Activity
from app.models.base import TimestampMixin
from app.models.community_post import CommunityPost
from app.models.eating_log import EatingLog
from app.models.llm_output import LLMOutput
from app.models.media_file import MediaFile
from app.models.milestone import Milestone
from app.models.pet import Pet
from app.models.sleep_log import SleepLog
from app.models.user import User
from app.models.user_pet import user_pets  # noqa: F401 - register table with Base.metadata

__all__ = [
    "Activity",
    "CommunityPost",
    "EatingLog",
    "LLMOutput",
    "MediaFile",
    "Milestone",
    "Pet",
    "SleepLog",
    "TimestampMixin",
    "User",
]
