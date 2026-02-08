"""Add weight to pets

Revision ID: e9f2a_pet_weight
Revises: d859e_veterinary
Create Date: 2026-02-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e9f2a_pet_weight"
down_revision: Union[str, None] = "d859e_veterinary"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("pets", sa.Column("weight", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("pets", "weight")
