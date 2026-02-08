"""
Seed the database with mock/demo data for the existing user with id 1.
Run from backend dir: uv run python scripts/seed_mock_data.py

Requires: a user with id 1 must already exist.

Adds for user 1 (matches frontend mockData.js):
- Pet Buddy (dog), owned by and linked to user 1
- Vet visit: 2025-10-24, Vet Checkup
- Community post: "New dog park opened!" (by Luna's Mom, a second user)
- Sleep and eating logs for activity stats

To have all logged-in users see this data, set DEMO_USER_ID=1 in .env.
"""

import asyncio
import os
import sys
from datetime import date, datetime, timedelta, timezone

# Ensure backend root is on path so `app` resolves
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select

from app.config import get_settings
from app.crud.community_post import community_post_crud
from app.crud.eating_log import eating_log_crud
from app.crud.pet import pet_crud
from app.crud.sleep_log import sleep_log_crud
from app.crud.user import user_crud
from app.db.session import async_session_maker
from app.models.community_post import CommunityPost
from app.models.eating_log import EatingLog
from app.models.pet import Pet
from app.models.sleep_log import SleepLog
from app.models.user import User
from app.models.vet import Vet
from app.models.vet_visit import VetVisit
from app.schemas.community import CommunityPostCreate
from app.schemas.pet import PetCreate
from app.schemas.user import UserCreate


# Second user for community post author (Luna's Mom)
LUNA_EMAIL = "luna@example.com"
LUNA_NAME = "Luna's Mom"
LUNA_PASSWORD = os.environ.get("SEED_LUNA_PASSWORD", "password123")


async def ensure_luna_user(session) -> User:
    """Get or create Luna's Mom for the community post author."""
    user = await user_crud.get_by_email(session, email=LUNA_EMAIL)
    if user:
        return user
    user = await user_crud.create(
        session,
        obj_in=UserCreate(name=LUNA_NAME, email=LUNA_EMAIL, password=LUNA_PASSWORD),
    )
    await session.flush()
    await session.refresh(user)
    return user


async def run_seed() -> None:
    async with async_session_maker() as session:
        try:
            # --- User 1: must already exist ---
            user1 = await user_crud.get(session, id=1)
            if not user1:
                raise SystemExit("User with id 1 not found. Create that user first, then run this script.")
            print(f"Adding mock data for existing user id=1 ({user1.name}, {user1.email}).")

            # --- Luna's Mom (community post author) ---
            user2 = await ensure_luna_user(session)
            await session.flush()

            # --- Pet: Buddy, owned by user 1 ---
            result = await session.execute(select(Pet).where(Pet.owner_id == user1.id).limit(1))
            existing_pet = result.scalar_one_or_none()
            if existing_pet:
                pet = existing_pet
                print(f"Pet '{pet.name}' already exists (id={pet.id}).")
            else:
                pet = await pet_crud.create(
                    session,
                    obj_in=PetCreate(name="Buddy", species="dog", owner_id=user1.id),
                )
                await session.flush()
                await session.refresh(pet)
                # Link pet to owner (user_pets + owner_id already set by create; ensure linked_pets)
                u1 = await session.get(User, user1.id)
                if u1 and pet not in u1.linked_pets:
                    u1.linked_pets.append(pet)
                await session.flush()
                print(f"Created pet '{pet.name}' (id={pet.id}) for user {user1.id}.")

            # --- Vet + Vet visit: 2025-10-24, Vet Checkup ---
            result = await session.execute(select(VetVisit).where(VetVisit.pet_id == pet.id).limit(1))
            existing_visit = result.scalar_one_or_none()
            if existing_visit:
                print("Vet visit already exists for this pet.")
            else:
                vet = await session.execute(select(Vet).limit(1))
                v = vet.scalar_one_or_none()
                if not v:
                    v = Vet(owner_id=user1.id, name="Main Street Vet", clinic_name="Pet Care Clinic")
                    session.add(v)
                    await session.flush()
                visit_date = date(2025, 10, 24)
                visit = VetVisit(
                    pet_id=pet.id,
                    vet_id=v.id,
                    visit_date=visit_date,
                    visit_reason="Vet Checkup",
                )
                session.add(visit)
                await session.flush()
                print(f"Created vet visit: {visit_date} - Vet Checkup.")

            # --- Community post: "New dog park opened!" by Luna's Mom ---
            result = await session.execute(
                select(CommunityPost).where(CommunityPost.title == "New dog park opened!").limit(1)
            )
            existing_post = result.scalar_one_or_none()
            if existing_post:
                print("Community post 'New dog park opened!' already exists.")
            else:
                post_in = CommunityPostCreate(
                    title="New dog park opened!",
                    content="Just wanted to share – the new dog park on Main St is amazing. Buddy loved it!",
                    pet_id=pet.id,
                )
                post = await community_post_crud.create(session, obj_in=post_in, user_id=user2.id)
                await session.flush()
                print(f"Created community post (id={post.id}) by {user2.name}.")

            # --- Optional: sleep and eating logs for activity stats (last 7 days) ---
            tz = timezone.utc
            today = date.today()
            sleep_logs_exist = await session.execute(
                select(SleepLog).where(SleepLog.pet_id == pet.id).limit(1)
            )
            if sleep_logs_exist.scalar_one_or_none() is None:
                # Seed 7 days of synthetic activity (sleep_minutes like 50, 80, 40, 95, 70, 60, 85)
                heights = [50, 80, 40, 95, 70, 60, 85]
                for i, h in enumerate(heights):
                    d = today - timedelta(days=(6 - i))
                    started = datetime(d.year, d.month, d.day, 22, 0, 0, tzinfo=tz)
                    log = SleepLog(
                        pet_id=pet.id,
                        started_at=started,
                        duration_minutes=h,
                        source="manual",
                    )
                    session.add(log)
                await session.flush()
                print("Created 7 sleep logs for activity stats.")
            eating_logs_exist = await session.execute(
                select(EatingLog).where(EatingLog.pet_id == pet.id).limit(1)
            )
            if eating_logs_exist.scalar_one_or_none() is None:
                for i in range(7):
                    d = today - timedelta(days=(6 - i))
                    occurred = datetime(d.year, d.month, d.day, 8, 0, 0, tzinfo=tz)
                    log = EatingLog(
                        pet_id=pet.id,
                        occurred_at=occurred,
                        meal_type="breakfast",
                        source="manual",
                    )
                    session.add(log)
                await session.flush()
                print("Created 7 eating logs for activity stats.")

            await session.commit()
            print("Seed completed successfully.")
            settings = get_settings()
            if settings.demo_user_id is None:
                print(f"Tip: Set DEMO_USER_ID=1 (or {user1.id}) in .env so all logged-in users see this demo data.")
            else:
                print(f"DEMO_USER_ID={settings.demo_user_id} is set: all authenticated users will see user {settings.demo_user_id}'s data.")
        except Exception as e:
            await session.rollback()
            print(f"Seed failed: {e}")
            raise


def main() -> None:
    asyncio.run(run_seed())


if __name__ == "__main__":
    main()
