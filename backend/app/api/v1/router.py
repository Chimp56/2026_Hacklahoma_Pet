"""V1 API router - aggregates all v1 endpoints."""

from fastapi import APIRouter

from app.api.v1.endpoints import pets

api_router = APIRouter()
api_router.include_router(pets.router)
