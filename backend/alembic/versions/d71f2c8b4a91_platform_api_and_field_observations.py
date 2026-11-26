"""Add equipment contract fields and field observations.

Revision ID: d71f2c8b4a91
Revises: 062edf6b1252
Create Date: 2026-11-26
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d71f2c8b4a91"
down_revision: Union[str, Sequence[str], None] = "062edf6b1252"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The initial migration used enum member names (uppercase). Rename the
    # PostgreSQL labels in place so persisted values match the shared wire contract.
    if op.get_bind().dialect.name == "postgresql":
        for old, new in (
            ("UPLOADED", "uploaded"),
            ("PROCESSING", "processing"),
            ("PROCESSED", "processed"),
            ("FAILED", "failed"),
        ):
            op.execute(f"ALTER TYPE documentstatus RENAME VALUE '{old}' TO '{new}'")

    op.add_column("equipment", sa.Column("model", sa.String(), nullable=True))
    op.add_column(
        "equipment",
        sa.Column("status", sa.String(), server_default="operational", nullable=False),
    )

    op.create_table(
        "field_observations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("equipment_id", sa.String(), nullable=False),
        sa.Column("reported_by", sa.String(), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="submitted", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "severity IN ('low', 'medium', 'high', 'critical')",
            name="ck_field_observations_severity",
        ),
        sa.ForeignKeyConstraint(["equipment_id"], ["equipment.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reported_by"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_field_observations_equipment_id", "field_observations", ["equipment_id"])
    op.create_index("ix_field_observations_reported_by", "field_observations", ["reported_by"])
    op.create_index("ix_field_observations_created_at", "field_observations", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_field_observations_created_at", table_name="field_observations")
    op.drop_index("ix_field_observations_reported_by", table_name="field_observations")
    op.drop_index("ix_field_observations_equipment_id", table_name="field_observations")
    op.drop_table("field_observations")
    op.drop_column("equipment", "status")
    op.drop_column("equipment", "model")
    if op.get_bind().dialect.name == "postgresql":
        for old, new in (
            ("uploaded", "UPLOADED"),
            ("processing", "PROCESSING"),
            ("processed", "PROCESSED"),
            ("failed", "FAILED"),
        ):
            op.execute(f"ALTER TYPE documentstatus RENAME VALUE '{old}' TO '{new}'")
