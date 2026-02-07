"""Pets API endpoints."""

from fastapi import APIRouter, HTTPException

from app.core.dependencies import DbSession
from app.crud.pet import pet_crud
from app.schemas.pet import PetCreate, PetResponse, PetUpdate

router = APIRouter(prefix="/pets", tags=["pets"])


@router.get("", response_model=list[PetResponse])
async def list_pets(
    db: DbSession,
    skip: int = 0,
    limit: int = 100,
) -> list[PetResponse]:
    """List pets with pagination."""
    pets = await pet_crud.get_multi(db, skip=skip, limit=limit)
    return list(pets)


@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(db: DbSession, pet_id: int) -> PetResponse:
    """Get a single pet by id."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet


@router.post("", response_model=PetResponse, status_code=201)
async def create_pet(db: DbSession, body: PetCreate) -> PetResponse:
    """Create a new pet."""
    return await pet_crud.create(db, obj_in=body)


@router.patch("/{pet_id}", response_model=PetResponse)
async def update_pet(db: DbSession, pet_id: int, body: PetUpdate) -> PetResponse:
    """Update a pet."""
    pet = await pet_crud.get(db, id=pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return await pet_crud.update(db, db_obj=pet, obj_in=body)


@router.delete("/{pet_id}", status_code=204)
async def delete_pet(db: DbSession, pet_id: int) -> None:
    """Delete a pet."""
    deleted = await pet_crud.delete(db, id=pet_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Pet not found")
