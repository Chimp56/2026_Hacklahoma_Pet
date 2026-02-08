"""Pets API endpoints."""

from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy import select

from app.config import get_settings
from app.core.dependencies import DbSession
from app.crud.eating_log import eating_log_crud
from app.crud.pet import pet_crud
from app.crud.sleep_log import sleep_log_crud
from app.models.media_file import MediaFile
from app.models.user import User
from app.schemas.habits import EatingLogCreate, EatingLogResponse, SleepLogCreate, SleepLogResponse
from app.schemas.medical_record import MedicalRecordResponse
from app.schemas.pet import PetCreate, PetResponse, PetUpdate
from app.services.qr_code import generate_qr_png
from app.services.storage import get_storage

router = APIRouter(prefix="/pets", tags=["pets"])

MEDICAL_RECORD_PDF = "application/pdf"
MEDICAL_RECORD_MAX_SIZE = 50 * 1024 * 1024  # 50 MB


def _medical_record_pdf_url(pet_id: int, record_id: int) -> str:
    """Return an accessible URL for the medical record PDF. Always uses the API file endpoint so it works for private buckets (e.g. DO Spaces)."""
    settings = get_settings()
    base = (settings.api_base_url or "http://localhost:8000").rstrip("/")
    prefix = (settings.api_v1_prefix or "/api/v1").rstrip("/")
    return f"{base}{prefix}/pets/{pet_id}/medical-records/{record_id}/file"


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
    """Create a new pet. If owner_id is set, that user is linked to the pet (and sees it in their pets list)."""
    pet = await pet_crud.create(db, obj_in=body)
    if pet.owner_id:
        user = await db.get(User, pet.owner_id)
        if user:
            user.linked_pets.append(pet)
            await db.flush()
    return pet


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


# --- Medical records (PDF in bucket) ---


@router.get("/{pet_id}/medical-records", response_model=list[MedicalRecordResponse])
async def list_medical_records(
    db: DbSession,
    pet_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[MedicalRecordResponse]:
    """List pet medical records (PDFs) for scrolling. Ordered by newest first."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    result = (
        await db.execute(
            select(MediaFile)
            .where(MediaFile.pet_id == pet_id, MediaFile.file_type == "document")
            .order_by(MediaFile.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
    )
    items = result.scalars().all()
    return [
        MedicalRecordResponse(
            id=m.id,
            url=_medical_record_pdf_url(pet_id, m.id),
            storage_key=m.storage_key,
            file_size_bytes=m.file_size_bytes,
            mime_type=m.mime_type,
            created_at=m.created_at,
        )
        for m in items
    ]


@router.get("/{pet_id}/medical-records/latest", response_model=MedicalRecordResponse)
async def get_latest_medical_record(
    db: DbSession,
    pet_id: int,
) -> MedicalRecordResponse:
    """Get the most recently uploaded medical record (PDF) for this pet. Returns metadata and URL to the file."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    result = await db.execute(
        select(MediaFile)
        .where(MediaFile.pet_id == pet_id, MediaFile.file_type == "document")
        .order_by(MediaFile.created_at.desc())
        .limit(1)
    )
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="No medical records found for this pet")
    return MedicalRecordResponse(
        id=media.id,
        url=_medical_record_pdf_url(pet_id, media.id),
        storage_key=media.storage_key,
        file_size_bytes=media.file_size_bytes,
        mime_type=media.mime_type,
        created_at=media.created_at,
    )


@router.get("/{pet_id}/medical-records/{record_id}", response_model=MedicalRecordResponse)
async def get_medical_record(
    db: DbSession,
    pet_id: int,
    record_id: int,
) -> MedicalRecordResponse:
    """Get a single medical record (PDF) by id for this pet. Returns metadata and accessible url to the file."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    result = await db.execute(
        select(MediaFile).where(
            MediaFile.id == record_id,
            MediaFile.pet_id == pet_id,
            MediaFile.file_type == "document",
        )
    )
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Medical record not found")
    return MedicalRecordResponse(
        id=media.id,
        url=_medical_record_pdf_url(pet_id, media.id),
        storage_key=media.storage_key,
        file_size_bytes=media.file_size_bytes,
        mime_type=media.mime_type,
        created_at=media.created_at,
    )


@router.get("/{pet_id}/medical-records/{record_id}/file", response_class=Response)
async def get_medical_record_file(
    db: DbSession,
    pet_id: int,
    record_id: int,
) -> Response:
    """Serve the medical record PDF. Used by the url returned in list/latest/get so the PDF is viewable for private buckets."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    result = await db.execute(
        select(MediaFile).where(
            MediaFile.id == record_id,
            MediaFile.pet_id == pet_id,
            MediaFile.file_type == "document",
        )
    )
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Medical record not found")
    try:
        storage = get_storage()
        data = storage.read(media.storage_key)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Medical record file not found in storage") from None
    return Response(
        content=data,
        media_type=MEDICAL_RECORD_PDF,
        headers={"Content-Disposition": "inline; filename=medical-record.pdf"},
    )


@router.post("/{pet_id}/medical-records", response_model=MedicalRecordResponse, status_code=201)
async def upload_medical_record(
    db: DbSession,
    pet_id: int,
    file: UploadFile = File(..., description="PDF file"),
    owner_id: int = Query(1, description="Owner user id (from auth when available)"),
) -> MedicalRecordResponse:
    """Upload a pet medical record (PDF). Stored in configured bucket (e.g. DigitalOcean Spaces)."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    content_type = (file.content_type or "").strip().lower()
    if content_type != MEDICAL_RECORD_PDF:
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed. Use Content-Type: application/pdf",
        )
    body = await file.read()
    if len(body) > MEDICAL_RECORD_MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size is {MEDICAL_RECORD_MAX_SIZE // (1024*1024)} MB",
        )
    storage = get_storage()
    key = storage.key_for("document", owner_id, file.filename or "medical-record.pdf")
    storage.save(key, body, content_type=MEDICAL_RECORD_PDF)
    settings = get_settings()
    media = MediaFile(
        owner_id=owner_id,
        pet_id=pet_id,
        file_type="document",
        mime_type=MEDICAL_RECORD_PDF,
        storage_key=key,
        storage_backend=settings.storage_backend,
        file_size_bytes=len(body),
    )
    db.add(media)
    await db.flush()
    await db.refresh(media)
    return MedicalRecordResponse(
        id=media.id,
        url=_medical_record_pdf_url(pet_id, media.id),
        storage_key=media.storage_key,
        file_size_bytes=media.file_size_bytes,
        mime_type=media.mime_type,
        created_at=media.created_at,
    )


@router.delete("/{pet_id}/medical-records/latest", status_code=204)
async def delete_latest_medical_record(
    db: DbSession,
    pet_id: int,
) -> None:
    """Delete the most recently uploaded medical record (PDF) for this pet."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    result = await db.execute(
        select(MediaFile)
        .where(MediaFile.pet_id == pet_id, MediaFile.file_type == "document")
        .order_by(MediaFile.created_at.desc())
        .limit(1)
    )
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="No medical records found for this pet")
    try:
        storage = get_storage()
        storage.delete(media.storage_key)
    except Exception:
        pass
    await db.delete(media)
    await db.flush()


@router.delete("/{pet_id}/medical-records/{record_id}", status_code=204)
async def delete_medical_record(
    db: DbSession,
    pet_id: int,
    record_id: int,
) -> None:
    """Delete a pet medical record (PDF). Removes file from storage and metadata from DB."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    result = await db.execute(
        select(MediaFile).where(
            MediaFile.id == record_id,
            MediaFile.pet_id == pet_id,
            MediaFile.file_type == "document",
        )
    )
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Medical record not found")
    try:
        storage = get_storage()
        storage.delete(media.storage_key)
    except Exception:
        pass  # still delete DB row if storage delete fails (e.g. already gone)
    await db.delete(media)
    await db.flush()


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
