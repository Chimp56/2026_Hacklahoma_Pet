"""CRUD operations for User."""

from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class CRUDUser:
    """CRUD for User model."""

    async def get(self, db: AsyncSession, *, id: int) -> User | None:
        """Get a user by id."""
        result = await db.execute(select(User).where(User.id == id))
        return result.scalar_one_or_none()

    async def get_by_email(self, db: AsyncSession, *, email: str) -> User | None:
        """Get a user by email."""
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[User]:
        """List users with pagination."""
        result = await db.execute(select(User).offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: UserCreate) -> User:
        """Create a user. Password is hashed."""
        user = User(
            name=obj_in.name,
            email=obj_in.email,
            hashed_password=get_password_hash(obj_in.password),
            display_name=obj_in.display_name,
            slack_webhook_url=obj_in.slack_webhook_url,
            slack_channel=obj_in.slack_channel,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    async def update(self, db: AsyncSession, *, db_obj: User, obj_in: UserUpdate) -> User:
        """Update a user. Hashes password if provided."""
        data = obj_in.model_dump(exclude_unset=True)
        if "password" in data:
            data["hashed_password"] = get_password_hash(data.pop("password"))
        for field, value in data.items():
            setattr(db_obj, field, value)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, *, id: int) -> bool:
        """Delete a user. Returns True if deleted."""
        user = await self.get(db, id=id)
        if user is None:
            return False
        await db.delete(user)
        await db.flush()
        return True


user_crud = CRUDUser()
