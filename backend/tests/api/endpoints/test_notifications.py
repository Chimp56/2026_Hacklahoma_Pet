"""Tests for notifications API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_test_slack_no_webhook(client: AsyncClient) -> None:
    """POST /api/v1/notifications/slack/test returns 503 when Slack not configured."""
    resp = await client.post("/api/v1/notifications/slack/test")
    assert resp.status_code == 503
    assert "slack" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_notify_flagged_event_not_in_flags(client: AsyncClient) -> None:
    """POST /api/v1/notifications/notify-event with non-flagged type returns sent: False."""
    resp = await client.post(
        "/api/v1/notifications/notify-event",
        params={"event_type": "unknown_event"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["sent"] is False
    assert "reason" in data


@pytest.mark.asyncio
async def test_notify_flagged_event_milestone(client: AsyncClient) -> None:
    """POST /api/v1/notifications/notify-event with milestone returns (may be sent: False if no webhook)."""
    resp = await client.post(
        "/api/v1/notifications/notify-event",
        params={"event_type": "milestone", "title": "Test Milestone"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "sent" in data
    assert data["event_type"] == "milestone"
