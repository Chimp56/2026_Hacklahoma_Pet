"""Media upload - images, audio, video. Files saved in file storage only; Postgres stores metadata (storage_key) only."""

import asyncio
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from moviepy import VideoFileClip
from sqlalchemy import select

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


def _extract_last_n_seconds_wav(video_bytes: bytes, seconds: float) -> bytes:
    """
    Extract the last n seconds of audio from video bytes as WAV (blocking).
    Uses MoviePy (imageio-ffmpeg); no system ffmpeg required.
    """
    suffix = ".mp4"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        video_path = f.name
        f.write(video_bytes)
        f.flush()
    wav_path = video_path + ".wav"
    clip = None
    sub = None
    try:
        clip = VideoFileClip(video_path)
        if clip.audio is None:
            raise RuntimeError("Video has no audio track")
        duration = clip.duration
        start = max(0.0, duration - seconds)
        sub = clip.subclip(start, duration)
        sub.audio.write_audiofile(
            wav_path,
            fps=44100,
            nbytes=2,
            codec="pcm_s16le",
            logger=None,
        )
        return Path(wav_path).read_bytes()
    finally:
        if sub is not None:
            try:
                sub.close()
            except Exception:
                pass
        if clip is not None:
            try:
                clip.close()
            except Exception:
                pass
        Path(video_path).unlink(missing_ok=True)
        Path(wav_path).unlink(missing_ok=True)


@router.get("/{media_id}/audio-tail", response_class=Response)
async def get_video_audio_tail(
    media_id: int,
    db: DbSession,
    seconds: float = Query(5.0, ge=0.1, le=300.0, description="Last N seconds of audio to extract (0.1–300)"),
) -> Response:
    """
    Get the last N seconds of audio from a stored video as a WAV file.
    The media file must be file_type=video (e.g. mp4, webm). Uses MoviePy (no system ffmpeg required).
    """
    result = await db.execute(
        select(MediaFile).where(MediaFile.id == media_id, MediaFile.file_type == "video")
    )
    media = result.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Video not found or not a video file")
    storage = get_storage()
    try:
        video_bytes = storage.read(media.storage_key)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Video file not found in storage") from None
    try:
        wav_bytes = await asyncio.to_thread(
            _extract_last_n_seconds_wav, video_bytes, seconds
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    if not wav_bytes:
        raise HTTPException(
            status_code=422,
            detail="Could not extract audio from video (format or duration issue).",
        )
    return Response(
        content=wav_bytes,
        media_type="audio/wav",
        headers={"Content-Disposition": f'attachment; filename="audio_tail_{media_id}_{int(seconds)}s.wav"'},
    )
