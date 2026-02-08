"""Stream endpoints - Twitch stream URL, current frame as JPEG, and HLS proxy for browser playback."""

import asyncio
import base64
import time
from typing import Any
from urllib.parse import urljoin

import cv2
import httpx
import streamlink
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import Response

router = APIRouter(prefix="/stream", tags=["stream"])

# User-Agent used when fetching from Twitch (server-side requests are allowed)
TWITCH_UA = "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0"

DEFAULT_CHANNEL = "speedingchimp"
TWITCH_BASE = "https://www.twitch.tv"

# Cache latest frame per channel for preview (avoid re-capturing on every request)
_FRAME_CACHE: dict[str, tuple[bytes, float]] = {}
_FRAME_CACHE_TTL_SEC = 15.0
_capture_lock = asyncio.Lock()


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
    Return the latest cached frame from the live stream as JPEG, or capture a new one.
    Cached for _FRAME_CACHE_TTL_SEC so preview (e.g. Home dashboard) is fast and does not
    trigger a new capture on every request.
    """
    now = time.monotonic()
    cached = _FRAME_CACHE.get(channel)
    if cached is not None:
        jpeg_bytes, cached_at = cached
        if now - cached_at < _FRAME_CACHE_TTL_SEC:
            return Response(content=jpeg_bytes, media_type="image/jpeg")

    try:
        stream_url = await asyncio.to_thread(_resolve_stream_url, channel)
    except (streamlink.exceptions.NoPluginError, streamlink.exceptions.PluginError) as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e

    async with _capture_lock:
        # Re-check cache after acquiring lock (another task may have filled it)
        cached = _FRAME_CACHE.get(channel)
        if cached is not None and (now - cached[1]) < _FRAME_CACHE_TTL_SEC:
            return Response(content=cached[0], media_type="image/jpeg")
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
        _FRAME_CACHE[channel] = (jpeg_bytes, time.monotonic())

    return Response(content=jpeg_bytes, media_type="image/jpeg")


def _rewrite_m3u8(content: str, base_url: str, proxy_base: str, channel: str) -> str:
    """Rewrite m3u8 playlist so all URLs go through our proxy (avoids browser 403 from Twitch)."""
    lines = []
    for line in content.splitlines():
        line = line.rstrip("\r\n")
        if not line or line.startswith("#"):
            lines.append(line)
            continue
        absolute = urljoin(base_url, line)
        encoded = base64.urlsafe_b64encode(absolute.encode()).decode().rstrip("=")
        proxy_url = f"{proxy_base}?channel={channel}&url={encoded}"
        lines.append(proxy_url)
    return "\n".join(lines) + "\n"


@router.get("/proxy", response_class=Response)
async def proxy_hls(
    request: Request,
    channel: str = Query(DEFAULT_CHANNEL, description="Twitch channel name"),
    url: str | None = Query(None, description="Base64url-encoded absolute URL (for segments/sub-playlists)"),
) -> Response:
    """
    Proxy HLS stream so the browser can play it. Twitch returns 403 when the browser
    requests the stream URL directly. This endpoint fetches playlists/segments server-side
    and returns them, rewriting playlist URLs to go through this proxy.
    """
    proxy_base = str(request.base_url).rstrip("/") + "/api/v1/stream/proxy"

    if url:
        try:
            pad = (4 - len(url) % 4) % 4
            target = base64.urlsafe_b64decode(url + "=" * pad).decode()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid url parameter") from None
        async with httpx.AsyncClient(
            follow_redirects=True,
            headers={"User-Agent": TWITCH_UA},
            timeout=20.0,
        ) as client:
            resp = await client.get(target)
            resp.raise_for_status()
            body = resp.content
            ct = resp.headers.get("content-type", "")
        if "mpegurl" in ct or "m3u8" in ct or target.endswith(".m3u8"):
            base_url = target.rsplit("/", 1)[0] + "/"
            body = _rewrite_m3u8(body.decode("utf-8", errors="replace"), base_url, proxy_base, channel).encode()
            ct = "application/vnd.apple.mpegurl"
        return Response(content=body, media_type=ct or "application/octet-stream")

    # No url: return root playlist (resolve stream and fetch m3u8)
    try:
        stream_url = await asyncio.to_thread(_resolve_stream_url, channel)
    except (streamlink.exceptions.NoPluginError, streamlink.exceptions.PluginError) as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e

    base_url = stream_url.rsplit("/", 1)[0] + "/"
    async with httpx.AsyncClient(
        follow_redirects=True,
        headers={"User-Agent": TWITCH_UA},
        timeout=15.0,
    ) as client:
        resp = await client.get(stream_url)
        resp.raise_for_status()
        content = resp.text
    rewritten = _rewrite_m3u8(content, base_url, proxy_base, channel)
    return Response(content=rewritten.encode(), media_type="application/vnd.apple.mpegurl")
