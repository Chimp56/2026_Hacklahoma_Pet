"""Slack notifications - send to user webhook or default channel."""

from typing import Any

import httpx

from app.config import get_settings


async def send_slack_notification(
    message: str,
    *,
    webhook_url: str | None = None,
    channel: str | None = None,
    blocks: list[dict[str, Any]] | None = None,
) -> bool:
    """
    Send a message to Slack. Uses webhook_url or settings.slack_webhook_url.
    Returns True if sent, False if no webhook configured or request failed.
    """
    url = webhook_url or get_settings().slack_webhook_url
    if not url:
        return False
    payload: dict[str, Any] = {"text": message}
    if channel:
        payload["channel"] = channel
    if blocks:
        payload["blocks"] = blocks
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
        return True
    except Exception:
        return False


def format_event_message(event_type: str, title: str, details: dict[str, Any] | None = None) -> str:
    """Build a simple Slack message for a flagged event."""
    lines = [f"*{title}*", f"Event: `{event_type}`"]
    if details:
        for k, v in details.items():
            lines.append(f"{k}: {v}")
    return "\n".join(lines)
