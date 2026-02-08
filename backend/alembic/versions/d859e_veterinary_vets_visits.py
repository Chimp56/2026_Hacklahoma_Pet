"""Add veterinary care: vets, vet_visits, media_files.vet_visit_id

Revision ID: d859e_veterinary
Revises: c748d_user_pets
Create Date: 2026-02-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d859e_veterinary"
down_revision: Union[str, None] = "c748d_user_pets"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "vets",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("clinic_name", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=64), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_vets_id"), "vets", ["id"], unique=False)
    op.create_index(op.f("ix_vets_owner_id"), "vets", ["owner_id"], unique=False)

    op.create_table(
        "vet_visits",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("pet_id", sa.Integer(), nullable=False),
        sa.Column("vet_id", sa.Integer(), nullable=True),
        sa.Column("visit_date", sa.Date(), nullable=False),
        sa.Column("visit_reason", sa.String(length=512), nullable=False),
        sa.Column("concerns", sa.Text(), nullable=True),
        sa.Column("activity", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["pet_id"], ["pets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["vet_id"], ["vets.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_vet_visits_id"), "vet_visits", ["id"], unique=False)
    op.create_index(op.f("ix_vet_visits_pet_id"), "vet_visits", ["pet_id"], unique=False)
    op.create_index(op.f("ix_vet_visits_vet_id"), "vet_visits", ["vet_id"], unique=False)

    op.add_column("media_files", sa.Column("vet_visit_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "media_files_vet_visit_id_fkey", "media_files", "vet_visits", ["vet_visit_id"], ["id"], ondelete="SET NULL"
    )
    op.create_index(op.f("ix_media_files_vet_visit_id"), "media_files", ["vet_visit_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_media_files_vet_visit_id"), table_name="media_files")
    op.drop_constraint("media_files_vet_visit_id_fkey", "media_files", type_="foreignkey")
    op.drop_column("media_files", "vet_visit_id")

    op.drop_index(op.f("ix_vet_visits_vet_id"), table_name="vet_visits")
    op.drop_index(op.f("ix_vet_visits_pet_id"), table_name="vet_visits")
    op.drop_index(op.f("ix_vet_visits_id"), table_name="vet_visits")
    op.drop_table("vet_visits")

    op.drop_index(op.f("ix_vets_owner_id"), table_name="vets")
    op.drop_index(op.f("ix_vets_id"), table_name="vets")
    op.drop_table("vets")
