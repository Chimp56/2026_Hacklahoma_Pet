"""Flag algorithm: decide when to send a notification (e.g. Slack)."""

from enum import Enum
from typing import Any

from app.config import get_settings


class FlagEvent(str, Enum):
    """Event types that can trigger a notification."""

    MILESTONE = "milestone"       # e.g. first sleep detected, eating
    HEALTH_ALERT = "health_alert"
    ANOMALY = "anomaly"          # unusual activity
    BREED_DETECTED = "breed_detected"
    ACTIVITY = "activity"        # optional: high-level activity


def should_notify(event_type: str | FlagEvent, metadata: dict[str, Any] | None = None) -> bool:
    """
    Return True if this event type is configured to trigger a notification.
    Uses NOTIFICATION_FLAG_EVENTS from config (comma-separated).
    """
    settings = get_settings()
    allowed = settings.flagged_events_set
    event = event_type.value if isinstance(event_type, FlagEvent) else str(event_type)
    return event in allowed
