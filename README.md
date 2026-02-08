# PetPulse — 2026 Hacklahoma

**PetPulse** is a full-stack pet wellness and management app. Track your pet’s health, activity, and vet visits, use AI to analyze photos and audio, and connect with other pet owners in the community.

---

## Features

- **Profiles & pets** — Create an account, add pets with species, breed, DOB, and health notes; upload profile pictures and medical record PDFs.
- **Dashboard** — Home view with upcoming vet visits, activity stats, and alerts.
- **Stats & calendar** — Activity stats (sleep, meals) over time; calendar with vet visits and optional daily activity.
- **Monitor** — Camera/stream integration: upload or capture frames and get AI analysis (sleep minutes, meal count, activity level).
- **Audio mood** — Upload pet audio; AI returns mood, confidence, species, and breed suggestions (Gemini).
- **Breed finder** — Upload a photo; AI suggests species and breeds with confidence (Gemini).
- **Community** — Create, edit, and delete posts; browse the feed.
- **Veterinary** — Record vet visits; attach medical record PDFs; view upcoming events.
- **Stream capture** — Optional Twitch HLS stream URL and current-frame capture for live monitoring.
- **Notifications** — Optional Slack webhooks for milestone, health, and anomaly events.

---

## Tech Stack

| Layer    | Stack |
|----------|--------|
| **Frontend** | React 18, Vite, React Router, Tailwind CSS, Framer Motion, HLS.js |
| **Backend**  | FastAPI, async SQLAlchemy (asyncpg), Pydantic v2, Alembic |
| **Database** | PostgreSQL |
| **AI**       | Google Gemini (image/audio/video); optional local Llama (text/vision) |
| **Storage**  | Local filesystem or DigitalOcean Spaces (S3-compatible) |

---

## Project structure

```
├── frontend/          # React + Vite app (PetPulse UI)
│   ├── src/
│   │   ├── api/       # Backend API client (auth, pets, community, gemini, etc.)
│   │   ├── components/
│   │   ├── context/   # AuthContext
│   │   ├── pages/     # Landing, Home, Stats, Calendar, Monitor, Audio, BreedFinder, Community, etc.
│   │   └── PetContext.jsx
│   └── package.json
├── backend/           # FastAPI API
│   ├── app/
│   │   ├── api/v1/endpoints/  # auth, users, pets, community, gemini, media, stream, notifications, veterinary
│   │   ├── core/      # dependencies, security
│   │   ├── crud/      # CRUD per model
│   │   ├── db/        # async engine, session
│   │   ├── models/    # User, Pet, Activity, VetVisit, CommunityPost, etc.
│   │   ├── schemas/   # Pydantic request/response
│   │   └── services/  # AI (Gemini/Llama), storage (local/Spaces), notifications, QR codes
│   ├── alembic/       # DB migrations
│   ├── run.py         # Run uvicorn
│   └── README.md      # Detailed API docs, migrations, stream, storage, tests
└── README.md          # This file
```

---

## Quick start

### Prerequisites

- **Node.js** (for frontend)
- **Python 3.11+** and **uv** ([install uv](https://docs.astral.sh/uv/getting-started/installation/))
- **PostgreSQL** (for backend)

### Backend

```bash
cd backend
uv venv
# Windows:   .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
uv sync
cp .env.example .env
# Edit .env: set DATABASE_URL, SECRET_KEY, and optionally GEMINI_API_KEY, storage, Slack, etc.
```

Apply migrations and run the API:

```bash
alembic upgrade head
uv run run.py
```

- **API:** http://localhost:8000  
- **Docs:** http://localhost:8000/api/docs  
- **Health:** http://localhost:8000/api/health  

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env: set VITE_API_URL=http://127.0.0.1:8000 (or your backend URL)
npm run dev
```

- **App:** http://localhost:5173 (or the port Vite prints)

---

## Environment

### Backend (`backend/.env`)

Copy from `backend/.env.example`. Key variables:

- **`DATABASE_URL`** — PostgreSQL with asyncpg, e.g. `postgresql+asyncpg://user:password@localhost:5432/pet_db`
- **`SECRET_KEY`** — JWT signing secret
- **`GEMINI_API_KEY`** — For image/audio/video AI (get key at [Google AI Studio](https://aistudio.google.com/apikey))
- **`STORAGE_BACKEND`** — `local` or `digitalocean`; if DigitalOcean, set `DO_SPACES_*` in `.env`
- **`CORS_ORIGINS`** — Comma-separated origins (e.g. `http://localhost:5173,http://127.0.0.1:5173`)

See `backend/.env.example` and **Backend README** for full list (Llama, Slack, stream, QR, etc.).

### Frontend (`frontend/.env`)

- **`VITE_API_URL`** or **`VITE_API_BASE_URL`** — Backend base URL with no trailing slash (e.g. `http://127.0.0.1:8000`). Default if unset: `https://api.quantara.co`.

---

## API overview

All v1 endpoints are under **`/api/v1`**. OpenAPI: **http://localhost:8000/api/docs**.

| Area        | Examples |
|------------|----------|
| **Auth**   | `POST /auth/login`, `GET /auth/me` |
| **Users**  | `GET/PATCH /users/me`, `GET /users/me/pets`, `GET /users/me/upcoming-events`, `GET /users/me/calendar/events` |
| **Pets**   | `GET/POST /pets`, `GET/PATCH/DELETE /pets/{id}`, `GET /pets/{id}/stats/activity`, vet visits, medical records |
| **Community** | `GET/POST /community/posts`, `GET/PATCH/DELETE /community/posts/{id}` |
| **AI (Gemini)** | `POST /gemini/analyze-pet`, `POST /gemini/analyze-audio`, `POST /gemini/analyze-activity`, `POST /gemini/analyze-pet-video` |
| **Media**  | `POST /media/upload`, pet profile picture, pet medical record PDFs |
| **Stream** | `GET /stream/url?channel=...`, `GET /stream/current-frame?channel=...` (Twitch HLS) |
| **Notifications** | `POST /notifications/notify-event` (Slack when configured) |

For detailed endpoints, migrations, stream capture, file storage, and tests, see **[backend/README.md](backend/README.md)**.

---

## Scripts

- **Backend tests:** `cd backend && pytest`
- **Seed demo data:** `cd backend && uv run python scripts/seed_mock_data.py` (see backend README for env vars)

---

## License

MIT License — see [LICENSE](LICENSE).
