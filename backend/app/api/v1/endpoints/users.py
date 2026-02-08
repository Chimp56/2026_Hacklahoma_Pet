"""Users API endpoints."""

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, DbSession
from app.crud.eating_log import eating_log_crud
from app.crud.sleep_log import sleep_log_crud
from app.crud.user import user_crud
from app.models.user import User
from app.models.vet_visit import VetVisit
from app.schemas.pet import PetResponse
from app.schemas.stats import (
    CalendarDayStats,
    CalendarEventsResponse,
    UpcomingEventItem,
    UpcomingEventsResponse,
)
from app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: CurrentUser) -> UserResponse:
    """Get the authenticated user's profile. Requires Bearer token. Alias for GET /auth/me."""
    return current_user


@router.get("/me/pets", response_model=list[PetResponse])
async def list_my_pets(current_user: CurrentUser) -> list[PetResponse]:
    """List all pets for the authenticated user. Requires Bearer token."""
    return list(current_user.linked_pets)


@router.patch("/me", response_model=UserResponse)
async def update_me(db: DbSession, current_user: CurrentUser, body: UserUpdate) -> UserResponse:
    """Update the authenticated user's profile. Requires Bearer token."""
    if body.email is not None and body.email != current_user.email:
        existing = await user_crud.get_by_email(db, email=body.email)
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
    return await user_crud.update(db=db, db_obj=current_user, obj_in=body)


@router.get("/me/upcoming-events", response_model=UpcomingEventsResponse)
async def list_my_upcoming_events(
    db: DbSession,
    current_user: CurrentUser,
    limit: int = Query(50, ge=1, le=100),
) -> UpcomingEventsResponse:
    """Upcoming vet visits for all of the current user's pets (visit_date >= today). Ordered by date ascending."""
    pet_ids = [p.id for p in current_user.linked_pets]
    if not pet_ids:
        return UpcomingEventsResponse(events=[])
    today = date.today()
    result = await db.execute(
        select(VetVisit)
        .options(selectinload(VetVisit.pet), selectinload(VetVisit.vet))
        .where(VetVisit.pet_id.in_(pet_ids), VetVisit.visit_date >= today)
        .order_by(VetVisit.visit_date.asc())
        .limit(limit)
    )
    visits = list(result.scalars().unique().all())
    events = [
        UpcomingEventItem(
            visit_id=v.id,
            pet_id=v.pet_id,
            pet_name=v.pet.name,
            visit_date=v.visit_date,
            visit_reason=v.visit_reason,
            vet_name=v.vet.name if v.vet else None,
            vet_clinic=v.vet.clinic_name if v.vet else None,
        )
        for v in visits
    ]
    return UpcomingEventsResponse(events=events)


@router.get("/me/calendar/events", response_model=CalendarEventsResponse)
async def list_my_calendar_events(
    db: DbSession,
    current_user: CurrentUser,
    start: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end: date = Query(..., description="End date (YYYY-MM-DD)"),
    include_activity: bool = Query(True, description="Include daily sleep/meals per pet"),
) -> CalendarEventsResponse:
    """Vet visits and optional daily activity for all of the current user's pets in the date range."""
    pet_ids = [p.id for p in current_user.linked_pets]
    if not pet_ids:
        return CalendarEventsResponse(vet_visits=[], daily_stats=[])
    if start > end:
        raise HTTPException(status_code=400, detail="start must be <= end")
    # Vet visits in range for any of user's pets
    result = await db.execute(
        select(VetVisit)
        .options(selectinload(VetVisit.pet), selectinload(VetVisit.vet))
        .where(VetVisit.pet_id.in_(pet_ids), VetVisit.visit_date >= start, VetVisit.visit_date <= end)
        .order_by(VetVisit.visit_date.asc())
    )
    visits = list(result.scalars().unique().all())
    vet_visits = [
        UpcomingEventItem(
            visit_id=v.id,
            pet_id=v.pet_id,
            pet_name=v.pet.name,
            visit_date=v.visit_date,
            visit_reason=v.visit_reason,
            vet_name=v.vet.name if v.vet else None,
            vet_clinic=v.vet.clinic_name if v.vet else None,
        )
        for v in visits
    ]
    daily_stats: list[CalendarDayStats] = []
    if include_activity:
        tz = timezone.utc
        since_dt = datetime(start.year, start.month, start.day, tzinfo=tz)
        until_dt = datetime(end.year, end.month, end.day, 23, 59, 59, 999999, tzinfo=tz)
        by_pet_date: dict[tuple[int, date], tuple[int, int]] = {}
        for pid in pet_ids:
            d = start
            while d <= end:
                by_pet_date[(pid, d)] = (0, 0)
                d += timedelta(days=1)
        for pid in pet_ids:
            sleep_logs = await sleep_log_crud.get_multi(db, pet_id=pid, since=since_dt, until=until_dt, limit=1000)
            eating_logs = await eating_log_crud.get_multi(db, pet_id=pid, since=since_dt, until=until_dt, limit=1000)
            for log in sleep_logs:
                d = log.started_at.date() if hasattr(log.started_at, "date") else log.started_at
                key = (pid, d)
                if key in by_pet_date:
                    mins = log.duration_minutes or 0
                    by_pet_date[key] = (by_pet_date[key][0] + mins, by_pet_date[key][1])
            for log in eating_logs:
                d = log.occurred_at.date() if hasattr(log.occurred_at, "date") else log.occurred_at
                key = (pid, d)
                if key in by_pet_date:
                    by_pet_date[key] = (by_pet_date[key][0], by_pet_date[key][1] + 1)
        daily_stats = [
            CalendarDayStats(pet_id=pid, day=d, sleep_minutes=sleep, meals_count=meals)
            for (pid, d), (sleep, meals) in sorted(by_pet_date.items(), key=lambda x: (x[0][0], x[0][1]))
        ]
    return CalendarEventsResponse(vet_visits=vet_visits, daily_stats=daily_stats)


@router.get("", response_model=list[UserResponse])
async def list_users(
    db: DbSession,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> list[UserResponse]:
    """List users with pagination."""
    users = await user_crud.get_multi(db, skip=skip, limit=limit)
    return list(users)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(db: DbSession, user_id: int) -> UserResponse:
    """Get a user by id."""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(db: DbSession, body: UserCreate) -> UserResponse:
    """Create a new user (e.g. registration). Email must be unique."""
    existing = await user_crud.get_by_email(db, email=body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    return await user_crud.create(db, obj_in=body)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(db: DbSession, user_id: int, body: UserUpdate) -> UserResponse:
    """Update a user. If email is changed, it must remain unique."""
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.email is not None and body.email != user.email:
        existing = await user_crud.get_by_email(db, email=body.email)
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
    return await user_crud.update(db, db_obj=user, obj_in=body)


@router.delete("/{user_id}", status_code=204)
async def delete_user(db: DbSession, user_id: int) -> None:
    """Delete a user."""
    deleted = await user_crud.delete(db, id=user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")


@router.get("/{user_id}/pets", response_model=list[PetResponse])
async def list_user_pets(db: DbSession, user_id: int) -> list[PetResponse]:
    """List all pets linked to this user (owned + shared via QR/link). A user can have 0 or more pets."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return list(user.linked_pets)
