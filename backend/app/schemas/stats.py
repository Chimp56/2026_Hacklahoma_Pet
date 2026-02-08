"""Stats and dashboard API schemas."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class DayActivityStats(BaseModel):
    """Activity stats for a single day."""

    day: date = Field(..., description="Date (YYYY-MM-DD)", serialization_alias="date")
    sleep_minutes: int = Field(0, ge=0, description="Total sleep duration that day")
    meals_count: int = Field(0, ge=0, description="Number of eating events that day")


class ActivityStatsResponse(BaseModel):
    """Activity stats for a pet over a date range (e.g. last 7 days)."""

    pet_id: int
    days: list[DayActivityStats] = Field(default_factory=list, description="Stats per day, newest first")


class UpcomingEventItem(BaseModel):
    """Single upcoming event (vet visit) for dashboard/calendar."""

    visit_id: int
    pet_id: int
    pet_name: str
    visit_date: date
    visit_reason: str
    vet_name: str | None = None
    vet_clinic: str | None = None


class UpcomingEventsResponse(BaseModel):
    """Upcoming vet visits for the user's pets."""

    events: list[UpcomingEventItem] = Field(default_factory=list)


class CalendarDayStats(BaseModel):
    """Per-pet, per-day activity for calendar view."""

    pet_id: int
    day: date = Field(..., description="Date (YYYY-MM-DD)", serialization_alias="date")
    sleep_minutes: int = Field(0, ge=0)
    meals_count: int = Field(0, ge=0)


class CalendarEventsResponse(BaseModel):
    """Calendar view: vet visits in range + daily activity stats."""

    vet_visits: list[UpcomingEventItem] = Field(default_factory=list)
    daily_stats: list[CalendarDayStats] = Field(default_factory=list)
