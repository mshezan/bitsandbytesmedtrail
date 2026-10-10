"""Patient data ownership, amendment history, and privacy requests.

Revision ID: aa71f8c0d541
Revises: 196fc36f925e
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "aa71f8c0d541"
down_revision: Union[str, None] = "196fc36f925e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("ck_records_source_type", "records", type_="check")
    op.create_check_constraint(
        "ck_records_source_type", "records",
        "source_type IN ('upload','connector','seed','self_reported')",
    )
    op.add_column("records", sa.Column("status", sa.String(32), nullable=False, server_default="active"))
    op.add_column("records", sa.Column("current_version", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("records", sa.Column("hidden_from_shares", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("records", sa.Column("patient_confirmed", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("records", sa.Column("verified_by_staff_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("staff.id")))

    op.add_column("patients", sa.Column("address", sa.Text(), nullable=True))
    op.add_column("patients", sa.Column("preferred_hospital", sa.String(200), nullable=True))
    op.add_column("patients", sa.Column("notification_preferences", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")))
    op.add_column("patients", sa.Column("privacy_preferences", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")))
    op.add_column("patients", sa.Column("profile_photo_url", sa.String(512), nullable=True))

    op.create_table(
        "record_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("record_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("records.id"), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("data", postgresql.JSONB(), nullable=False),
        sa.Column("changed_by_staff_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("staff.id")),
        sa.Column("org_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id")),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("record_id", "version", name="uq_record_version"),
    )
    op.create_table(
        "correction_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("record_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("records.id")),
        sa.Column("source_org_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("request_type", sa.String(32), nullable=False, server_default="record"),
        sa.Column("field_name", sa.String(200), nullable=False),
        sa.Column("believed_correct", sa.Text(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("attachment_file_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("files.id")),
        sa.Column("status", sa.String(32), nullable=False, server_default="open"),
        sa.Column("reviewed_by_staff_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("staff.id")),
        sa.Column("resolution_reason", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_correction_requests_org_status", "correction_requests", ["source_org_id", "status"])
    op.create_table(
        "patient_record_notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("record_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("records.id"), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "privacy_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("request_type", sa.String(32), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("privacy_requests")
    op.drop_table("patient_record_notes")
    op.drop_index("ix_correction_requests_org_status", table_name="correction_requests")
    op.drop_table("correction_requests")
    op.drop_table("record_versions")
    op.drop_column("patients", "profile_photo_url")
    op.drop_column("patients", "privacy_preferences")
    op.drop_column("patients", "notification_preferences")
    op.drop_column("patients", "preferred_hospital")
    op.drop_column("patients", "address")
    op.drop_column("records", "hidden_from_shares")
    op.drop_column("records", "verified_by_staff_id")
    op.drop_column("records", "patient_confirmed")
    op.drop_column("records", "current_version")
    op.drop_column("records", "status")
    op.drop_constraint("ck_records_source_type", "records", type_="check")
    op.create_check_constraint(
        "ck_records_source_type", "records", "source_type IN ('upload','connector','seed')"
    )
