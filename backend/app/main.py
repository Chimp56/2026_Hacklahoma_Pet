"""FastAPI application entry point."""

import asyncio
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app import __version__
from app.api.v1.router import api_router
from app.config import get_settings
from app.db.session import async_session_maker
from app.services.storage import get_storage


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup and shutdown events."""
    # Startup: e.g. connect DB, load caches
    yield
    # Shutdown: e.g. close DB pool
    pass


def create_application() -> FastAPI:
    """Application factory."""
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        description="API for Pet-related features.",
        version=__version__,
        docs_url="/api/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=settings.cors_credentials,
        allow_methods=settings.cors_methods,
        allow_headers=settings.cors_headers,
    )

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.get("/api/health", tags=["Health"])
    async def health_check() -> dict:
        """Liveness/readiness probe."""
        return {"status": "ok", "version": __version__}

    @app.get("/api/health/access", tags=["Health"])
    async def health_access() -> dict[str, Any]:
        """
        Check Postgres and DigitalOcean Spaces access.
        Returns status for each; useful for verifying credentials and connectivity.
        """
        result: dict[str, Any] = {"postgres": {}, "spaces": {}}

        # Postgres: run a simple query
        try:
            async with async_session_maker() as session:
                await session.execute(text("SELECT 1"))
            result["postgres"] = {"ok": True}
        except Exception as e:
            result["postgres"] = {"ok": False, "error": str(e)}

        # Spaces: only when using digitalocean backend
        if settings.storage_backend != "digitalocean":
            result["spaces"] = {"ok": None, "message": "skipped (storage_backend is not digitalocean)"}
        else:
            try:
                storage = get_storage()
                client = storage._get_client()
                client.head_bucket(Bucket=storage.bucket)
                result["spaces"] = {"ok": True}
            except Exception as e:
                result["spaces"] = {"ok": False, "error": str(e)}

        return result

    return app


app = create_application()
