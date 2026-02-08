"""V1 API router - aggregates all v1 endpoints."""

from fastapi import APIRouter

from app.api.v1.endpoints import gemini, media, notifications, pets, stream

api_router = APIRouter()
api_router.include_router(pets.router)
api_router.include_router(gemini.router)
api_router.include_router(media.router)
api_router.include_router(stream.router)
api_router.include_router(notifications.router)
