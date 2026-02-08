"""Notification endpoints - test Slack; trigger flagged event."""

from fastapi import APIRouter, HTTPException

from app.services.notifications import send_slack_notification, should_notify
from app.services.notifications.slack import format_event_message

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/slack/test")
async def test_slack(message: str = "Pet API test notification") -> dict:
    """Send a test message to Slack (uses SLACK_WEBHOOK_URL)."""
    ok = await send_slack_notification(message)
    if not ok:
        raise HTTPException(
            status_code=503,
            detail="Slack not configured or send failed. Set SLACK_WEBHOOK_URL.",
        )
    return {"sent": True}


@router.post("/notify-event")
async def notify_flagged_event(
    event_type: str = "milestone",
    title: str = "Milestone detected",
    details: dict | None = None,
) -> dict:
    """
    If event_type is in NOTIFICATION_FLAG_EVENTS, send to Slack.
    Use for testing or for backend-triggered events (milestone, health_alert, anomaly).
    """
    if not should_notify(event_type):
        return {"sent": False, "reason": "Event type not in NOTIFICATION_FLAG_EVENTS"}
    message = format_event_message(event_type, title, details or {})
    ok = await send_slack_notification(message)
    return {"sent": ok, "event_type": event_type}
