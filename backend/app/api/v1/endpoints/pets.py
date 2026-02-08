"""Pets API endpoints."""

from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import select

from app.config import get_settings
from app.core.dependencies import DbSession
from app.crud.eating_log import eating_log_crud
from app.crud.pet import pet_crud
from app.crud.sleep_log import sleep_log_crud
from app.models.media_file import MediaFile
from app.schemas.habits import EatingLogCreate, EatingLogResponse, SleepLogCreate, SleepLogResponse
from app.schemas.pet import PetCreate, PetResponse, PetUpdate
from app.services.qr_code import generate_qr_png
from app.services.storage import get_storage

router = APIRouter(prefix="/pets", tags=["pets"])


@router.get("", response_model=list[PetResponse])
async def list_pets(
    db: DbSession,
    skip: int = 0,
    limit: int = 100,
) -> list[PetResponse]:
    """List pets with pagination."""
    pets = await pet_crud.get_multi(db, skip=skip, limit=limit)
    return list(pets)


@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(db: DbSession, pet_id: int) -> PetResponse:
    """Get a single pet by id."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet


@router.post("", response_model=PetResponse, status_code=201)
async def create_pet(db: DbSession, body: PetCreate) -> PetResponse:
    """Create a new pet."""
    return await pet_crud.create(db, obj_in=body)


@router.patch("/{pet_id}", response_model=PetResponse)
async def update_pet(db: DbSession, pet_id: int, body: PetUpdate) -> PetResponse:
    """Update a pet."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return await pet_crud.update(db, db_obj=pet, obj_in=body)


@router.delete("/{pet_id}", status_code=204)
async def delete_pet(db: DbSession, pet_id: int) -> None:
    """Delete a pet."""
    deleted = await pet_crud.delete(db, id=pet_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Pet not found")


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
