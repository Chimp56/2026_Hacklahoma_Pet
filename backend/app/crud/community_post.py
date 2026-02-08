"""CRUD operations for CommunityPost."""

from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.community_post import CommunityPost
from app.schemas.community import CommunityPostCreate, CommunityPostUpdate


class CRUDCommunityPost:
    """CRUD for CommunityPost model."""

    async def get(self, db: AsyncSession, *, id: int) -> CommunityPost | None:
        """Get a post by id with user and pet loaded."""
        result = await db.execute(
            select(CommunityPost)
            .where(CommunityPost.id == id)
            .options(selectinload(CommunityPost.user), selectinload(CommunityPost.pet))
        )
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 50,
    ) -> Sequence[CommunityPost]:
        """List posts newest first, with user and pet loaded."""
        result = await db.execute(
            select(CommunityPost)
            .options(selectinload(CommunityPost.user), selectinload(CommunityPost.pet))
            .order_by(CommunityPost.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.unique().scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: CommunityPostCreate, user_id: int) -> CommunityPost:
        """Create a post."""
        post = CommunityPost(
            user_id=user_id,
            content=obj_in.content,
            title=obj_in.title,
            pet_id=obj_in.pet_id,
        )
        db.add(post)
        await db.flush()
        await db.refresh(post)
        return post

    async def update(
        self, db: AsyncSession, *, db_obj: CommunityPost, obj_in: CommunityPostUpdate
    ) -> CommunityPost:
        """Update a post."""
        data = obj_in.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(db_obj, field, value)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, *, id: int) -> bool:
        """Delete a post. Returns True if deleted."""
        post = await self.get(db, id=id)
        if post is None:
            return False
        await db.delete(post)
        await db.flush()
        return True


community_post_crud = CRUDCommunityPost()
