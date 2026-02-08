"""Veterinary care endpoints: vets, vet visits, medical records (docs). All under /pets/{pet_id}/veterinary/."""

from datetime import date

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy import select

from app.config import get_settings
from app.core.dependencies import DbSession
from app.crud.pet import pet_crud
from app.models.media_file import MediaFile
from app.models.vet import Vet
from app.models.vet_visit import VetVisit
from app.schemas.medical_record import MedicalRecordResponse
from app.schemas.vet import VetCreate, VetResponse, VetUpdate
from app.schemas.vet_visit import VetVisitCreate, VetVisitResponse, VetVisitUpdate
from app.services.storage import get_storage

router = APIRouter(prefix="/{pet_id}/veterinary", tags=["veterinary"])

MEDICAL_RECORD_PDF = "application/pdf"
MEDICAL_RECORD_MAX_SIZE = 50 * 1024 * 1024  # 50 MB


def _medical_record_pdf_url(pet_id: int, record_id: int) -> str:
    """Accessible URL for the medical record PDF (veterinary path)."""
    settings = get_settings()
    base = (settings.api_base_url or "http://localhost:8000").rstrip("/")
    prefix = (settings.api_v1_prefix or "/api/v1").rstrip("/")
    return f"{base}{prefix}/pets/{pet_id}/veterinary/medical-records/{record_id}/file"


# --- Vets ---


@router.get("/vets", response_model=list[VetResponse])
async def list_vets(
    db: DbSession,
    pet_id: int,
    owner_id: int | None = Query(None, description="Filter by owner (user) id"),
    skip: int = 0,
    limit: int = 100,
) -> list[VetResponse]:
    """List vets. Optionally filter by owner_id (vets added by that user)."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    q = select(Vet)
    if owner_id is not None:
        q = q.where(Vet.owner_id == owner_id)
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


@router.post("/vets", response_model=VetResponse, status_code=201)
async def create_vet(
    db: DbSession,
    pet_id: int,
    body: VetCreate,
) -> VetResponse:
    """Add a vet (veterinarian or clinic)."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    vet = Vet(
        name=body.name,
        clinic_name=body.clinic_name,
        phone=body.phone,
        address=body.address,
        owner_id=body.owner_id,
    )
    db.add(vet)
    await db.flush()
    await db.refresh(vet)
    return vet


@router.get("/vets/{vet_id}", response_model=VetResponse)
async def get_vet(db: DbSession, pet_id: int, vet_id: int) -> VetResponse:
    """Get a vet by id."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    vet = await db.get(Vet, vet_id)
    if not vet:
        raise HTTPException(status_code=404, detail="Vet not found")
    return vet


@router.patch("/vets/{vet_id}", response_model=VetResponse)
async def update_vet(db: DbSession, pet_id: int, vet_id: int, body: VetUpdate) -> VetResponse:
    """Update a vet."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    vet = await db.get(Vet, vet_id)
    if not vet:
        raise HTTPException(status_code=404, detail="Vet not found")
    data = body.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(vet, field, value)
    await db.flush()
    await db.refresh(vet)
    return vet


@router.delete("/vets/{vet_id}", status_code=204)
async def delete_vet(db: DbSession, pet_id: int, vet_id: int) -> None:
    """Delete a vet. Vet visits that referenced this vet will have vet_id set to NULL."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    vet = await db.get(Vet, vet_id)
    if not vet:
        raise HTTPException(status_code=404, detail="Vet not found")
    await db.delete(vet)
    await db.flush()


# --- Vet visits ---


@router.get("/visits", response_model=list[VetVisitResponse])
async def list_vet_visits(
    db: DbSession,
    pet_id: int,
    skip: int = 0,
    limit: int = 100,
) -> list[VetVisitResponse]:
    """List vet visit history for this pet. Ordered by visit_date descending."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    result = await db.execute(
        select(VetVisit).where(VetVisit.pet_id == pet_id).order_by(VetVisit.visit_date.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


@router.get("/visits/upcoming", response_model=list[VetVisitResponse])
async def list_upcoming_visits(
    db: DbSession,
    pet_id: int,
    limit: int = Query(20, ge=1, le=100),
) -> list[VetVisitResponse]:
    """Upcoming vet visits for this pet (visit_date >= today). Ordered by visit_date ascending."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    today = date.today()
    result = await db.execute(
        select(VetVisit)
        .where(VetVisit.pet_id == pet_id, VetVisit.visit_date >= today)
        .order_by(VetVisit.visit_date.asc())
        .limit(limit)
    )
    return list(result.scalars().all())


@router.post("/visits", response_model=VetVisitResponse, status_code=201)
async def create_vet_visit(
    db: DbSession,
    pet_id: int,
    body: VetVisitCreate,
) -> VetVisitResponse:
    """Add a vet visit (concerns, activity, visit reason, date)."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    if body.vet_id is not None:
        vet = await db.get(Vet, body.vet_id)
        if not vet:
            raise HTTPException(status_code=404, detail="Vet not found")
    visit = VetVisit(
        pet_id=pet_id,
        vet_id=body.vet_id,
        visit_date=body.visit_date,
        visit_reason=body.visit_reason,
        concerns=body.concerns,
        activity=body.activity,
    )
    db.add(visit)
    await db.flush()
    await db.refresh(visit)
    return visit


@router.get("/visits/{visit_id}", response_model=VetVisitResponse)
async def get_vet_visit(db: DbSession, pet_id: int, visit_id: int) -> VetVisitResponse:
    """Get a vet visit by id."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    result = await db.execute(
        select(VetVisit).where(VetVisit.id == visit_id, VetVisit.pet_id == pet_id)
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Vet visit not found")
    return visit


@router.patch("/visits/{visit_id}", response_model=VetVisitResponse)
async def update_vet_visit(
    db: DbSession,
    pet_id: int,
    visit_id: int,
    body: VetVisitUpdate,
) -> VetVisitResponse:
    """Update a vet visit."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    result = await db.execute(
        select(VetVisit).where(VetVisit.id == visit_id, VetVisit.pet_id == pet_id)
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Vet visit not found")
    data = body.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(visit, field, value)
    await db.flush()
    await db.refresh(visit)
    return visit


@router.delete("/visits/{visit_id}", status_code=204)
async def delete_vet_visit(db: DbSession, pet_id: int, visit_id: int) -> None:
    """Delete a vet visit. Linked medical records will have vet_visit_id set to NULL."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    result = await db.execute(
        select(VetVisit).where(VetVisit.id == visit_id, VetVisit.pet_id == pet_id)
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Vet visit not found")
    await db.delete(visit)
    await db.flush()


# --- Medical records (docs) ---


@router.get("/medical-records", response_model=list[MedicalRecordResponse])
async def list_medical_records(
    db: DbSession,
    pet_id: int,
    visit_id: int | None = Query(None, description="Filter by vet visit id"),
    skip: int = 0,
    limit: int = 50,
) -> list[MedicalRecordResponse]:
    """List medical record PDFs for this pet. Optionally filter by vet visit. Ordered by newest first."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    q = select(MediaFile).where(MediaFile.pet_id == pet_id, MediaFile.file_type == "document")
    if visit_id is not None:
        q = q.where(MediaFile.vet_visit_id == visit_id)
    q = q.order_by(MediaFile.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
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


@router.get("/medical-records/latest", response_model=MedicalRecordResponse)
async def get_latest_medical_record(db: DbSession, pet_id: int) -> MedicalRecordResponse:
    """Get the most recently uploaded medical record (PDF) for this pet."""
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


@router.get("/medical-records/{record_id}", response_model=MedicalRecordResponse)
async def get_medical_record(db: DbSession, pet_id: int, record_id: int) -> MedicalRecordResponse:
    """Get a single medical record (PDF) by id."""
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


@router.get("/medical-records/{record_id}/file", response_class=Response)
async def get_medical_record_file(db: DbSession, pet_id: int, record_id: int) -> Response:
    """Serve the medical record PDF (accessible URL for private buckets)."""
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


@router.post("/medical-records", response_model=MedicalRecordResponse, status_code=201)
async def upload_medical_record(
    db: DbSession,
    pet_id: int,
    file: UploadFile = File(..., description="PDF file"),
    owner_id: int = Query(1, description="Owner user id (from auth when available)"),
    vet_visit_id: int | None = Query(None, description="Optional: link this document to a vet visit"),
) -> MedicalRecordResponse:
    """Upload a medical record PDF. Optionally link to a vet visit."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    if vet_visit_id is not None:
        result = await db.execute(
            select(VetVisit).where(VetVisit.id == vet_visit_id, VetVisit.pet_id == pet_id)
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(status_code=404, detail="Vet visit not found")
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
        vet_visit_id=vet_visit_id,
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


@router.delete("/medical-records/latest", status_code=204)
async def delete_latest_medical_record(db: DbSession, pet_id: int) -> None:
    """Delete the most recently uploaded medical record for this pet."""
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


@router.delete("/medical-records/{record_id}", status_code=204)
async def delete_medical_record(db: DbSession, pet_id: int, record_id: int) -> None:
    """Delete a medical record (PDF)."""
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
        pass
    await db.delete(media)
    await db.flush()
