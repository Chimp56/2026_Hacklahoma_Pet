# Pet API (FastAPI)

FastAPI backend with async SQLAlchemy, Pydantic v2, and versioned API.

## Setup

Install uv: https://docs.astral.sh/uv/getting-started/installation/

```bash
cd backend
uv venv
# .venv/Scripts/activate   # Windows
source .venv/bin/activate  # macOS/Linux
uv sync
cp .env.example .env     # Edit .env with your DATABASE_URL and SECRET_KEY
```

## Run

```bash
uv run run.py
# or: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000  
- Docs: http://localhost:8000/api/docs  
- Health: http://localhost:8000/api/health  
- Access check (Postgres + Spaces): http://localhost:8000/api/health/access  

## Migrations (Alembic)

Uses `DATABASE_URL` from `.env` (PostgreSQL with asyncpg).

```bash
cd backend
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
# Rollback one revision:
alembic downgrade -1
```

## Stream capture

**API (Twitch):**

- **`GET /api/v1/stream/url?channel=speedingchimp`** – Returns the direct HLS stream URL for the channel (uses streamlink). Use this URL with ffmpeg.
- **`GET /api/v1/stream/current-frame?channel=speedingchimp`** – Returns the current live frame as JPEG (uses **OpenCV / cv2**). Use for quick capture or feeding into Gemini.

Default channel is `speedingchimp`; override with query param `channel=<name>`.

**Manual capture:** Install OBS and/or streamlink; save under `storage/stream_capture/` (see paths below).

```bash
cd backend
mkdir -p storage/stream_capture storage/stream_capture/frames
```

```bash
# Get stream URL via API: GET /api/v1/stream/url?channel=speedingchimp
# Or CLI: streamlink --stream-url twitch.tv/speedingchimp best
ffmpeg -i "<STREAM_URL>" -c copy -f segment -segment_time 10 -segment_format mp4 storage/stream_capture/segment_%03d.mp4
```

```bash
ffmpeg -i storage/stream_capture/segment_001.mp4 -vf fps=1 storage/stream_capture/frames/frame_%04d.jpg
```

## Tests

```bash
pytest
```

## AI models (image / audio)

- **Gemini** – image and audio analysis. Set `GEMINI_API_KEY` in `.env`.
- **Llama 3.2 1B Instruct** – text-only, Transformers pipeline (local). Set `HF_LLAMA_MODEL`; `HF_TOKEN` optional for gated models. For image/audio use `model=gemini` or `model=llama_vision`.

Use `POST /api/v1/gemini/analyze-pet?model=gemini` for images. Audio is supported only with `model=gemini`. Llama is available for text generation (no image/audio).

## File storage

- **Local** – `STORAGE_BACKEND=local`, files under `STORAGE_LOCAL_PATH` (default `./storage`).
- **DigitalOcean Spaces** – set `STORAGE_BACKEND=digitalocean` and DO credentials (`DO_SPACES_*`). For bucket `pet-storage` in sfo3 use `DO_SPACES_BUCKET=pet-storage`, `DO_SPACES_REGION=sfo3`, `DO_SPACES_ENDPOINT=https://sfo3.digitaloceanspaces.com` (bucket URL: https://pet-storage.sfo3.digitaloceanspaces.com).

`POST /api/v1/media/upload` uploads images, audio, video, or document (PDF).

**Pet medical records (PDF):** `POST /api/v1/pets/{pet_id}/medical-records` uploads a PDF; `GET /api/v1/pets/{pet_id}/medical-records` lists records (newest first) for scrolling. Stored in the configured bucket.

## Notifications (Slack)

- Set `SLACK_WEBHOOK_URL` (incoming webhook). Optionally `NOTIFICATION_FLAG_EVENTS=milestone,health_alert,anomaly`.
- When a detection is **flagged** (event type in the list), the app can send to Slack. Use `POST /api/v1/notifications/notify-event` to trigger or test.

## Project layout

```
app/
├── main.py              # App factory, CORS, lifespan
├── config.py            # Pydantic Settings from env
├── api/v1/
│   ├── router.py        # Aggregates v1 endpoints
│   └── endpoints/       # pets, gemini (AI), media, notifications
├── core/                # Dependencies, security
├── db/                  # Async engine, session, Base
├── models/              # User, Pet, Activity, Milestone, LLMOutput, CommunityPost, MediaFile
├── schemas/             # Pydantic request/response
├── crud/                # CRUD operations per model
└── services/
    ├── storage/        # File storage (local + DigitalOcean Spaces)
    ├── ai/             # AI providers (Gemini, Llama registry)
    └── notifications/  # Flag algorithm + Slack
alembic/                # Migrations (env.py uses app config + models)
tests/
```
