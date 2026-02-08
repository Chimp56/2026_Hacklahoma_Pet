"""CRUD operations for Pet."""

from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pet import Pet
from app.schemas.pet import PetCreate, PetUpdate


class CRUDPet:
    """CRUD for Pet model."""

    async def get(self, db: AsyncSession, id: int) -> Pet | None:
        """Get a pet by id."""
        result = await db.execute(select(Pet).where(Pet.id == id))
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[Pet]:
        """List pets with pagination."""
        result = await db.execute(select(Pet).offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: PetCreate) -> Pet:
        """Create a pet. Sets owner_id if provided; caller should add (owner_id, pet_id) to user_pets."""
        pet = Pet(
            name=obj_in.name,
            species=obj_in.species,
            breed=obj_in.breed,
            gender=obj_in.gender,
            date_of_birth=obj_in.date_of_birth,
            health_notes=obj_in.health_notes,
            owner_id=obj_in.owner_id,
        )
        db.add(pet)
        await db.flush()
        await db.refresh(pet)
        return pet

    async def update(self, db: AsyncSession, *, db_obj: Pet, obj_in: PetUpdate) -> Pet:
        """Update a pet."""
        data = obj_in.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(db_obj, field, value)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, *, id: int) -> bool:
        """Delete a pet. Returns True if deleted."""
        pet = await self.get(db, id=id)
        if pet is None:
            return False
        await db.delete(pet)
        await db.flush()
        return True


pet_crud = CRUDPet()
