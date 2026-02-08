"""Tests for notification services."""

from unittest.mock import patch

import pytest

from app.services.notifications.flags import FlagEvent, should_notify
from app.services.notifications.slack import format_event_message


def test_format_event_message() -> None:
    """format_event_message builds Slack message."""
    msg = format_event_message("milestone", "First sleep detected", {"pet_id": 1})
    assert "First sleep detected" in msg
    assert "milestone" in msg
    assert "pet_id" in msg
    assert "1" in msg


def test_format_event_message_no_details() -> None:
    """format_event_message without details."""
    msg = format_event_message("health_alert", "Low activity")
    assert "Low activity" in msg
    assert "health_alert" in msg


@patch("app.services.notifications.flags.get_settings")
def test_should_notify_when_configured(mock_settings) -> None:
    """should_notify returns True when event in flagged list."""
    mock_settings.return_value.flagged_events_set = {"milestone", "health_alert"}
    assert should_notify("milestone") is True
    assert should_notify(FlagEvent.MILESTONE) is True


@patch("app.services.notifications.flags.get_settings")
def test_should_notify_when_not_configured(mock_settings) -> None:
    """should_notify returns False when event not in list."""
    mock_settings.return_value.flagged_events_set = {"milestone"}
    assert should_notify("health_alert") is False
    assert should_notify("unknown") is False
