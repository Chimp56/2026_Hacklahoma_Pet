"""Media upload - images, audio, video. Files saved in file storage only; Postgres stores metadata (storage_key) only."""

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.config import get_settings
from app.core.dependencies import DbSession
from app.models.media_file import MediaFile
from app.services.storage import get_storage

router = APIRouter(prefix="/media", tags=["media"])

ALLOWED = {
    "image": {"image/jpeg", "image/png", "image/webp", "image/gif"},
    "audio": {"audio/wav", "audio/wave", "audio/mpeg", "audio/mp3", "audio/webm"},
    "video": {"video/mp4", "video/webm", "video/quicktime"},
    "document": {"application/pdf"},
}
MAX_SIZE = 100 * 1024 * 1024  # 100 MB


@router.post("/upload")
async def upload_media(
    db: DbSession,
    file: UploadFile = File(...),
    file_type: str = Query("image", description="image | audio | video | document (PDF)"),
    owner_id: int = Query(1, description="Owner user id (from auth when available)"),
    pet_id: int | None = Query(None, description="Optional pet id to associate"),
) -> dict:
    """
    Upload a file. Content is saved in file storage (local or DigitalOcean Spaces); only metadata is stored in Postgres.
    Returns media_file id, storage_key, and optional url.
    """
    if file_type not in ALLOWED:
        raise HTTPException(status_code=400, detail="file_type must be image, audio, or video")
    content_type = file.content_type or ""
    if content_type not in ALLOWED[file_type]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid type for {file_type}. Allowed: {', '.join(ALLOWED[file_type])}",
        )
    body = await file.read()
    if len(body) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

    # Save file to storage only (never to Postgres)
    storage = get_storage()
    key = storage.key_for(file_type, owner_id, file.filename or "file")
    storage.save(key, body, content_type=content_type)
    url = storage.get_url(key)

    # Store metadata in Postgres (storage_key reference only)
    settings = get_settings()
    media = MediaFile(
        owner_id=owner_id,
        pet_id=pet_id,
        file_type=file_type,
        mime_type=content_type,
        storage_key=key,
        storage_backend=settings.storage_backend,
        file_size_bytes=len(body),
    )
    db.add(media)
    await db.flush()
    await db.refresh(media)

    return {
        "id": media.id,
        "storage_key": key,
        "url": url,
        "size": len(body),
        "content_type": content_type,
        "storage_backend": settings.storage_backend,
    }
