"""Add user name column

Revision ID: b637c_add_user_name
Revises: a526a62b5bc3
Create Date: 2026-02-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b637c_add_user_name"
down_revision: Union[str, None] = "a526a62b5bc3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("name", sa.String(length=255), nullable=True))
    op.execute(
        sa.text("UPDATE users SET name = COALESCE(display_name, email) WHERE name IS NULL")
    )
    op.alter_column(
        "users",
        "name",
        existing_type=sa.String(255),
        nullable=False,
    )
    op.create_index(op.f("ix_users_name"), "users", ["name"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_name"), table_name="users")
    op.drop_column("users", "name")
