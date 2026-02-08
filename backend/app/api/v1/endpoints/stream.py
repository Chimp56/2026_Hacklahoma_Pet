"""Stream endpoints - Twitch stream URL and current frame as JPEG."""

import asyncio
from typing import Any

import cv2
import streamlink
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

router = APIRouter(prefix="/stream", tags=["stream"])

DEFAULT_CHANNEL = "speedingchimp"
TWITCH_BASE = "https://www.twitch.tv"


def _capture_frame_cv2(stream_url: str, timeout_sec: float = 15.0) -> bytes:
    """
    Open stream with cv2.VideoCapture, read one frame, return JPEG bytes (blocking).
    Follows OpenCV docs: create capture, set props before open when possible, check isOpened(),
    read(), check frame, imencode and check retval, release() in finally.
    """
    cap = cv2.VideoCapture()  # no URL yet so we can set properties before open
    try:
        # Set timeouts only if available (opencv-python may not expose these constants)
        if hasattr(cv2, "CAP_PROP_OPEN_TIMEOUT_MS"):
            cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MS, timeout_sec * 1000)
        if hasattr(cv2, "CAP_PROP_READ_TIMEOUT_MS"):
            cap.set(cv2.CAP_PROP_READ_TIMEOUT_MS, timeout_sec * 1000)
        # Prefer FFmpeg backend for HLS/URL streams
        if hasattr(cv2, "CAP_FFMPEG"):
            opened = cap.open(stream_url, cv2.CAP_FFMPEG)
        else:
            opened = cap.open(stream_url)
        if not opened or not cap.isOpened():
            raise ValueError("Could not open stream")
        # Reduce buffer for fresher frame on live streams (when supported)
        if hasattr(cv2, "CAP_PROP_BUFFERSIZE"):
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        ret, frame = cap.read()
        if not ret or frame is None or (hasattr(frame, "size") and frame.size == 0):
            raise ValueError("Could not read frame from stream")
        success, jpeg = cv2.imencode(".jpg", frame)
        if not success or jpeg is None:
            raise ValueError("Could not encode frame as JPEG")
        return jpeg.tobytes()
    finally:
        cap.release()


def _resolve_stream_url(channel: str) -> str:
    """Resolve Twitch channel to best HLS stream URL (blocking; run in thread)."""
    url = f"{TWITCH_BASE}/{channel}" if not channel.startswith("http") else channel
    if TWITCH_BASE not in url and "twitch.tv" not in url:
        url = f"{TWITCH_BASE}/{channel}"
    streams = streamlink.streams(url)
    if not streams:
        raise ValueError(f"No streams found for {url} (channel may be offline)")
    best = streams.get("best") or streams.get("worst") or next(iter(streams.values()))
    return best.url


@router.get("/url")
async def get_stream_url(
    channel: str = Query(DEFAULT_CHANNEL, description="Twitch channel name or full twitch.tv URL"),
) -> dict[str, Any]:
    """
    Get the direct HLS stream URL for a Twitch channel (e.g. for ffmpeg).
    Uses streamlink to resolve twitch.tv/channel to the actual stream URL.
    """
    try:
        stream_url = await asyncio.to_thread(_resolve_stream_url, channel)
        return {"stream_url": stream_url, "channel": channel}
    except (streamlink.exceptions.NoPluginError, streamlink.exceptions.PluginError) as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/current-frame", response_class=Response)
async def get_current_frame(
    channel: str = Query(DEFAULT_CHANNEL, description="Twitch channel name or full twitch.tv URL"),
) -> Response:
    """
    Capture the current frame from the live stream and return it as JPEG.
    Uses OpenCV (cv2) to open the stream and read one frame. May take a few seconds.
    """
    try:
        stream_url = await asyncio.to_thread(_resolve_stream_url, channel)
    except (streamlink.exceptions.NoPluginError, streamlink.exceptions.PluginError) as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e

    try:
        jpeg_bytes = await asyncio.wait_for(
            asyncio.to_thread(_capture_frame_cv2, stream_url, 15.0),
            timeout=20.0,
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Timeout capturing frame from stream. Stream may be offline or slow.",
        ) from None
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e

    return Response(content=jpeg_bytes, media_type="image/jpeg")
