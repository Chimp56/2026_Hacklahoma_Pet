"""Add user_pets association table (many-to-many users <-> pets)

Revision ID: c748d_user_pets
Revises: b637c_add_user_name
Create Date: 2026-02-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c748d_user_pets"
down_revision: Union[str, None] = "b637c_add_user_name"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_pets",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("pet_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["pet_id"], ["pets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "pet_id"),
    )
    op.create_index(op.f("ix_user_pets_pet_id"), "user_pets", ["pet_id"], unique=False)
    op.create_index(op.f("ix_user_pets_user_id"), "user_pets", ["user_id"], unique=False)

    # Backfill: every pet with an owner_id gets (owner_id, pet_id) in user_pets
    op.execute(
        sa.text(
            "INSERT INTO user_pets (user_id, pet_id) "
            "SELECT owner_id, id FROM pets WHERE owner_id IS NOT NULL"
        )
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_user_pets_user_id"), table_name="user_pets")
    op.drop_index(op.f("ix_user_pets_pet_id"), table_name="user_pets")
    op.drop_table("user_pets")
