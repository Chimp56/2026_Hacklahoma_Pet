"""Community feed endpoints: list, create, get, update, delete posts."""

from fastapi import APIRouter, HTTPException, Query

from app.core.dependencies import CurrentUser, DbSession
from app.crud.community_post import community_post_crud
from app.models.community_post import CommunityPost
from app.schemas.community import CommunityPostCreate, CommunityPostResponse, CommunityPostUpdate

router = APIRouter(prefix="/community", tags=["community"])


def _post_to_response(post: CommunityPost) -> CommunityPostResponse:
    """Build response with user_name and pet_name from relationships."""
    return CommunityPostResponse(
        id=post.id,
        user_id=post.user_id,
        content=post.content,
        title=post.title,
        pet_id=post.pet_id,
        user_name=post.user.name if post.user else None,
        pet_name=post.pet.name if post.pet else None,
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


@router.get("/posts", response_model=list[CommunityPostResponse])
async def list_posts(
    db: DbSession,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> list[CommunityPostResponse]:
    """List community posts newest first. Optional auth."""
    posts = await community_post_crud.get_multi(db, skip=skip, limit=limit)
    return [_post_to_response(p) for p in posts]


@router.post("/posts", response_model=CommunityPostResponse, status_code=201)
async def create_post(db: DbSession, current_user: CurrentUser, body: CommunityPostCreate) -> CommunityPostResponse:
    """Create a post. Requires Bearer token."""
    post = await community_post_crud.create(db, obj_in=body, user_id=current_user.id)
    return _post_to_response(post)


@router.get("/posts/{post_id}", response_model=CommunityPostResponse)
async def get_post(db: DbSession, post_id: int) -> CommunityPostResponse:
    """Get a single post by id."""
    post = await community_post_crud.get(db, id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return _post_to_response(post)


@router.patch("/posts/{post_id}", response_model=CommunityPostResponse)
async def update_post(
    db: DbSession,
    post_id: int,
    body: CommunityPostUpdate,
    current_user: CurrentUser,
) -> CommunityPostResponse:
    """Update own post. Requires Bearer token."""
    post = await community_post_crud.get(db, id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to update this post")
    post = await community_post_crud.update(db, db_obj=post, obj_in=body)
    return _post_to_response(post)


@router.delete("/posts/{post_id}", status_code=204)
async def delete_post(db: DbSession, post_id: int, current_user: CurrentUser) -> None:
    """Delete own post. Requires Bearer token."""
    post = await community_post_crud.get(db, id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this post")
    await community_post_crud.delete(db, id=post_id)
