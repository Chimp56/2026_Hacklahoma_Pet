"""Add activity_state_logs table for active/resting state changes

Revision ID: f0a3b_activity_state_logs
Revises: e9f2a_pet_weight
Create Date: 2026-02-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f0a3b_activity_state_logs"
down_revision: Union[str, None] = "e9f2a_pet_weight"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "activity_state_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("pet_id", sa.Integer(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("start_time", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["pet_id"], ["pets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_activity_state_logs_id"), "activity_state_logs", ["id"], unique=False)
    op.create_index(op.f("ix_activity_state_logs_pet_id"), "activity_state_logs", ["pet_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_activity_state_logs_pet_id"), table_name="activity_state_logs")
    op.drop_index(op.f("ix_activity_state_logs_id"), table_name="activity_state_logs")
    op.drop_table("activity_state_logs")
