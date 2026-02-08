"""Pets API endpoints."""

from datetime import date, datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.vet_visit import VetVisit

from app.config import get_settings
from app.core.dependencies import DbSession
from app.crud.activity_state_log import activity_state_log_crud
from app.crud.eating_log import eating_log_crud
from app.crud.pet import pet_crud
from app.crud.sleep_log import sleep_log_crud
from app.models.media_file import MediaFile
from app.models.user import User
from app.schemas.habits import (
    ActivityStateLogCreate,
    ActivityStateLogResponse,
    EatingLogCreate,
    EatingLogResponse,
    SleepLogCreate,
    SleepLogResponse,
)
from app.schemas.pet import PetCreate, PetResponse, PetUpdate
from app.schemas.stats import ActivityStatsResponse, CalendarDayStats, CalendarEventsResponse, DayActivityStats, UpcomingEventItem
from app.services.qr_code import generate_qr_png
from app.services.storage import get_storage

router = APIRouter(prefix="/pets", tags=["pets"])

ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/webp", "image/gif"}
PROFILE_PHOTO_MAX_SIZE = 10 * 1024 * 1024  # 10 MB


async def _get_pet_profile_photo_url(db: DbSession, pet_id: int) -> Optional[str]:
    """Return the API URL for the pet's profile picture (same-origin, works like medical records)."""
    media = await _get_pet_profile_photo_media(db, pet_id)
    if not media:
        return None
    base = get_settings().api_base_url.rstrip("/")
    return f"{base}/api/v1/pets/{pet_id}/profile-picture"


async def _get_pet_profile_photo_media(db: DbSession, pet_id: int) -> Optional[MediaFile]:
    """Return the latest MediaFile (image) for the pet, or None."""
    result = await db.execute(
        select(MediaFile)
        .where(MediaFile.pet_id == pet_id, MediaFile.file_type == "image")
        .order_by(MediaFile.id.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


@router.get("", response_model=list[PetResponse])
async def list_pets(
    db: DbSession,
    skip: int = 0,
    limit: int = 100,
) -> list[PetResponse]:
    """List pets with pagination."""
    pets = await pet_crud.get_multi(db, skip=skip, limit=limit)
    out = []
    for pet in pets:
        data = PetResponse.model_validate(pet).model_dump()
        data["profile_photo_url"] = await _get_pet_profile_photo_url(db, pet.id)
        out.append(data)
    return out


@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(db: DbSession, pet_id: int) -> PetResponse:
    """Get a single pet by id."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    data = PetResponse.model_validate(pet).model_dump()
    data["profile_photo_url"] = await _get_pet_profile_photo_url(db, pet_id)
    return data


@router.post("", response_model=PetResponse, status_code=201)
async def create_pet(db: DbSession, body: PetCreate) -> PetResponse:
    """Create a new pet. If owner_id is set, that user is linked to the pet (and sees it in their pets list)."""
    pet = await pet_crud.create(db, obj_in=body)
    if pet.owner_id:
        user = await db.get(User, pet.owner_id)
        if user:
            user.linked_pets.append(pet)
            await db.flush()
    data = PetResponse.model_validate(pet).model_dump()
    data["profile_photo_url"] = await _get_pet_profile_photo_url(db, pet.id)
    return data


@router.patch("/{pet_id}", response_model=PetResponse)
async def update_pet(db: DbSession, pet_id: int, body: PetUpdate) -> PetResponse:
    """Update a pet."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    updated = await pet_crud.update(db, db_obj=pet, obj_in=body)
    data = PetResponse.model_validate(updated).model_dump()
    data["profile_photo_url"] = await _get_pet_profile_photo_url(db, pet_id)
    return data


@router.get("/{pet_id}/profile-picture", response_class=Response)
async def get_pet_profile_picture(db: DbSession, pet_id: int) -> Response:
    """
    Return the pet's current profile picture (latest uploaded image).
    Use this URL as img src when storage does not provide a public URL (e.g. local dev).
    """
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    media = await _get_pet_profile_photo_media(db, pet_id)
    if not media:
        raise HTTPException(status_code=404, detail="No profile picture set for this pet")
    storage = get_storage()
    try:
        body = storage.read(media.storage_key)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Profile picture file not found") from None
    return Response(content=body, media_type=media.mime_type)


@router.post("/{pet_id}/profile-picture")
async def upload_pet_profile_picture(
    db: DbSession,
    pet_id: int,
    file: UploadFile = File(...),
) -> dict:
    """
    Upload a profile picture for the pet. Accepts image/jpeg, image/png, image/webp, image/gif.
    Returns url (from storage if available) and profile_picture_url (API endpoint to display the image).
    """
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    content_type = (file.content_type or "").strip().lower()
    if content_type not in ALLOWED_IMAGE:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid type. Allowed: image/jpeg, image/png, image/webp, image/gif",
        )
    body = await file.read()
    if len(body) > PROFILE_PHOTO_MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")
    owner_id = pet.owner_id or 1
    storage = get_storage()
    key = storage.key_for("image", owner_id, file.filename or "profile.jpg")
    storage.save(key, body, content_type=content_type)
    url = storage.get_url(key)
    settings = get_settings()
    media = MediaFile(
        owner_id=owner_id,
        pet_id=pet_id,
        file_type="image",
        mime_type=content_type,
        storage_key=key,
        storage_backend=settings.storage_backend,
        file_size_bytes=len(body),
    )
    db.add(media)
    await db.flush()
    base = get_settings().api_base_url.rstrip("/")
    profile_picture_url = f"{base}/api/v1/pets/{pet_id}/profile-picture"
    return {"url": url, "profile_picture_url": profile_picture_url, "media_id": media.id}


@router.delete("/{pet_id}", status_code=204)
async def delete_pet(db: DbSession, pet_id: int) -> None:
    """Delete a pet."""
    deleted = await pet_crud.delete(db, id=pet_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Pet not found")


@router.post("/{pet_id}/add-to-account", response_model=PetResponse, status_code=201)
async def add_pet_to_account(
    db: DbSession,
    pet_id: int,
    user_id: int = Query(..., description="User id of the account to add this pet to (from auth when available)"),
) -> PetResponse:
    """
    Add this pet to a user's account (e.g. after scanning the pet's share QR or opening a share link).
    The pet will appear in GET /api/v1/users/{user_id}/pets. Idempotent: if already linked, returns 200 with the pet.
    """
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if pet in user.linked_pets:
        return pet  # already linked
    user.linked_pets.append(pet)
    await db.flush()
    await db.refresh(pet)
    return pet


@router.get("/{pet_id}/qr-code/share", response_class=Response)
async def get_pet_qr_code_share(db: DbSession, pet_id: int) -> Response:
    """
    Generate a QR code that links to the share page where another user can add this pet to their account.
    Scan the QR or open the link, then call POST /api/v1/pets/{pet_id}/add-to-account with your user_id.
    """
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    settings = get_settings()
    base = (settings.api_base_url or "http://localhost:8000").rstrip("/")
    share_url = f"{base}/share/pet/{pet_id}"
    logo_bytes: Optional[bytes] = None
    result = await db.execute(
        select(MediaFile)
        .where(MediaFile.pet_id == pet_id, MediaFile.file_type == "image")
        .order_by(MediaFile.id.desc())
        .limit(1)
    )
    media = result.scalar_one_or_none()
    if media:
        try:
            storage = get_storage()
            logo_bytes = storage.read(media.storage_key)
        except Exception:
            pass
    png_bytes = generate_qr_png(share_url, logo_bytes=logo_bytes)
    return Response(content=png_bytes, media_type="image/png")


@router.get("/{pet_id}/qr-code", response_class=Response)
async def get_pet_qr_code(db: DbSession, pet_id: int) -> Response:
    """
    Generate a QR code that links to this pet's profile.
    The center logo is the pet's profile picture if they have one, otherwise a paw icon.
    """
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    settings = get_settings()
    base = (settings.pet_profile_base_url or "http://localhost:3000").rstrip("/")
    profile_url = f"{base}/pet/{pet_id}"

    logo_bytes: Optional[bytes] = None
    result = await db.execute(
        select(MediaFile)
        .where(MediaFile.pet_id == pet_id, MediaFile.file_type == "image")
        .order_by(MediaFile.id.desc())
        .limit(1)
    )
    media = result.scalar_one_or_none()
    if media:
        try:
            storage = get_storage()
            logo_bytes = storage.read(media.storage_key)
        except Exception:
            pass

    token = (settings.qr_code_api_access_token or "").strip()
    if token and logo_bytes is None:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.post(
                    "https://api.qr-code-generator.com/v1/create",
                    params={"access-token": token},
                    json={
                        "frame_name": "no-frame",
                        "qr_code_text": profile_url,
                        "image_format": "PNG",
                        "qr_code_logo": "scan-me-square",
                    },
                )
                r.raise_for_status()
                return Response(content=r.content, media_type="image/png")
        except httpx.HTTPError:
            pass
    png_bytes = generate_qr_png(profile_url, logo_bytes=logo_bytes)
    return Response(content=png_bytes, media_type="image/png")


# --- Stats / dashboard ---


@router.get("/{pet_id}/stats/activity", response_model=ActivityStatsResponse)
async def get_activity_stats(
    db: DbSession,
    pet_id: int,
    days: int = Query(7, ge=1, le=90, description="Number of days to include"),
) -> ActivityStatsResponse:
    """Activity stats per day (sleep minutes, meals count) for the last N days. For dashboard charts."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    tz = timezone.utc
    today = date.today()
    since_dt = datetime(today.year, today.month, today.day, tzinfo=tz) - timedelta(days=days)
    until_dt = datetime(today.year, today.month, today.day, 23, 59, 59, 999999, tzinfo=tz)
    sleep_logs = await sleep_log_crud.get_multi(db, pet_id=pet_id, since=since_dt, until=until_dt, limit=500)
    eating_logs = await eating_log_crud.get_multi(db, pet_id=pet_id, since=since_dt, until=until_dt, limit=500)
    by_date: dict[date, tuple[int, int]] = {}
    for d in (today - timedelta(days=i) for i in range(days)):
        by_date[d] = (0, 0)
    for log in sleep_logs:
        d = log.started_at.date() if hasattr(log.started_at, "date") else log.started_at
        if d in by_date:
            mins = log.duration_minutes or 0
            by_date[d] = (by_date[d][0] + mins, by_date[d][1])
    for log in eating_logs:
        d = log.occurred_at.date() if hasattr(log.occurred_at, "date") else log.occurred_at
        if d in by_date:
            by_date[d] = (by_date[d][0], by_date[d][1] + 1)
    day_list = [DayActivityStats(day=d, sleep_minutes=by_date[d][0], meals_count=by_date[d][1]) for d in sorted(by_date, reverse=True)]
    return ActivityStatsResponse(pet_id=pet_id, days=day_list)


# --- Calendar ---


@router.get("/{pet_id}/calendar/events", response_model=CalendarEventsResponse)
async def get_calendar_events(
    db: DbSession,
    pet_id: int,
    start: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end: date = Query(..., description="End date (YYYY-MM-DD)"),
    include_activity: bool = Query(True, description="Include daily sleep/meals stats"),
) -> CalendarEventsResponse:
    """Vet visits and optional daily activity for this pet in the given date range."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    if start > end:
        raise HTTPException(status_code=400, detail="start must be <= end")
    # Vet visits in range
    result = await db.execute(
        select(VetVisit)
        .options(selectinload(VetVisit.pet), selectinload(VetVisit.vet))
        .where(VetVisit.pet_id == pet_id, VetVisit.visit_date >= start, VetVisit.visit_date <= end)
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
        sleep_logs = await sleep_log_crud.get_multi(db, pet_id=pet_id, since=since_dt, until=until_dt, limit=2000)
        eating_logs = await eating_log_crud.get_multi(db, pet_id=pet_id, since=since_dt, until=until_dt, limit=2000)
        by_date: dict[date, tuple[int, int]] = {}
        d = start
        while d <= end:
            by_date[d] = (0, 0)
            d += timedelta(days=1)
        for log in sleep_logs:
            d = log.started_at.date() if hasattr(log.started_at, "date") else log.started_at
            if d in by_date:
                mins = log.duration_minutes or 0
                by_date[d] = (by_date[d][0] + mins, by_date[d][1])
        for log in eating_logs:
            d = log.occurred_at.date() if hasattr(log.occurred_at, "date") else log.occurred_at
            if d in by_date:
                by_date[d] = (by_date[d][0], by_date[d][1] + 1)
        daily_stats = [
            CalendarDayStats(pet_id=pet_id, day=d, sleep_minutes=by_date[d][0], meals_count=by_date[d][1])
            for d in sorted(by_date)
        ]
    return CalendarEventsResponse(vet_visits=vet_visits, daily_stats=daily_stats)


# --- Sleep habits ---


@router.get("/{pet_id}/sleep-logs", response_model=list[SleepLogResponse])
async def list_sleep_logs(
    db: DbSession,
    pet_id: int,
    since: Optional[datetime] = Query(None, description="Filter logs on or after this time"),
    until: Optional[datetime] = Query(None, description="Filter logs on or before this time"),
    skip: int = 0,
    limit: int = 100,
) -> list[SleepLogResponse]:
    """List sleep logs for a pet (e.g. dog)."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    logs = await sleep_log_crud.get_multi(db, pet_id=pet_id, since=since, until=until, skip=skip, limit=limit)
    return list(logs)


@router.post("/{pet_id}/sleep-logs", response_model=SleepLogResponse, status_code=201)
async def create_sleep_log(db: DbSession, pet_id: int, body: SleepLogCreate) -> SleepLogResponse:
    """Log a sleep session for a pet (e.g. when dog went to sleep / woke up)."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return await sleep_log_crud.create(db, pet_id=pet_id, obj_in=body)


# --- Eating habits ---


@router.get("/{pet_id}/eating-logs", response_model=list[EatingLogResponse])
async def list_eating_logs(
    db: DbSession,
    pet_id: int,
    since: Optional[datetime] = Query(None, description="Filter logs on or after this time"),
    until: Optional[datetime] = Query(None, description="Filter logs on or before this time"),
    meal_type: Optional[str] = Query(None, description="Filter by meal_type: breakfast, lunch, dinner, snack"),
    skip: int = 0,
    limit: int = 100,
) -> list[EatingLogResponse]:
    """List eating logs for a pet (e.g. dog)."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    logs = await eating_log_crud.get_multi(
        db, pet_id=pet_id, since=since, until=until, meal_type=meal_type, skip=skip, limit=limit
    )
    return list(logs)


@router.post("/{pet_id}/eating-logs", response_model=EatingLogResponse, status_code=201)
async def create_eating_log(db: DbSession, pet_id: int, body: EatingLogCreate) -> EatingLogResponse:
    """Log an eating event for a pet (e.g. when dog ate and what meal)."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return await eating_log_crud.create(db, pet_id=pet_id, obj_in=body)


# --- Activity state (active / resting) for live stats chart ---


@router.get("/{pet_id}/activity-state-logs", response_model=list[ActivityStateLogResponse])
async def list_activity_state_logs(
    db: DbSession,
    pet_id: int,
    since: Optional[datetime] = Query(None, description="Filter logs on or after this time (for live chart)"),
    until: Optional[datetime] = Query(None, description="Filter logs on or before this time"),
    skip: int = 0,
    limit: int = Query(500, ge=1, le=2000),
) -> list[ActivityStateLogResponse]:
    """List activity state changes for a pet. Use for stats live chart (poll with since/until)."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    logs = await activity_state_log_crud.get_multi(
        db, pet_id=pet_id, since=since, until=until, skip=skip, limit=limit
    )
    return list(logs)


@router.post("/{pet_id}/activity-state-logs", response_model=ActivityStateLogResponse, status_code=201)
async def create_activity_state_log(
    db: DbSession, pet_id: int, body: ActivityStateLogCreate
) -> ActivityStateLogResponse:
    """Log an activity state change (active vs resting). Call when pet transitions to/from active."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return await activity_state_log_crud.create(db, pet_id=pet_id, obj_in=body)
