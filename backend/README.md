# Pet API (FastAPI)

FastAPI backend with async SQLAlchemy, Pydantic v2, and versioned API.

## Setup

Python 3.10 (recommended)

```bash
cd backend
python -m venv .venv
# .venv/Scripts/activate   # Windows
source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt --no-deps
cp .env.example .env     # Edit .env with your DATABASE_URL and SECRET_KEY
```

## Run

```bash
python run.py
# or: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000  
- Docs: http://localhost:8000/docs  
- Health: http://localhost:8000/health  

## Tests

```bash
pytest
```

## Project layout

```
app/
├── main.py           # App factory, CORS, lifespan
├── config.py         # Pydantic Settings from env
├── api/v1/
│   ├── router.py     # Aggregates v1 endpoints
│   └── endpoints/    # Route modules (pets, ...)
├── core/             # Dependencies, security (JWT, bcrypt)
├── db/               # Async engine, session, Base
├── models/           # SQLAlchemy ORM models
├── schemas/          # Pydantic request/response
└── crud/             # CRUD operations per model
tests/
```
