"""initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-10-09
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("role", sa.Enum("patient", "clinician", name="user_role"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(32), nullable=False, unique=True),
        sa.Column("email", sa.String(255), unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "patients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("dob", sa.Date(), nullable=False),
        sa.Column("sex", sa.String(32), nullable=False),
        sa.Column("blood_group", sa.String(8)),
        sa.Column("emergency_contact", sa.String(200)),
    )

    op.create_table(
        "files",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("object_key", sa.String(512), nullable=False),
        sa.Column("mime", sa.String(128), nullable=False),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("type", sa.String(32), nullable=False),
        sa.Column("fhir", postgresql.JSONB, nullable=False),
        sa.Column("source_name", sa.String(200), nullable=False),
        sa.Column("source_type", sa.String(32), nullable=False),
        sa.Column("recorded_date", sa.Date(), nullable=False),
        sa.Column("confidence", sa.Float()),
        sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("file_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("files.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint(
            "type IN ('condition','medication','observation','allergy','encounter','report')",
            name="ck_records_type",
        ),
        sa.CheckConstraint(
            "source_type IN ('upload','connector','seed')",
            name="ck_records_source_type",
        ),
    )
    op.create_index("ix_records_patient_date", "records", ["patient_id", "recorded_date"])
    op.create_index("ix_records_type", "records", ["type"])

    op.create_table(
        "shares",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("token_hash", sa.String(128), nullable=False, unique=True),
        sa.Column("scope", postgresql.JSONB, nullable=False),
        sa.Column("pin_hash", sa.String(128)),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("is_emergency", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    op.create_table(
        "audit_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("actor_type", sa.String(32), nullable=False),
        sa.Column("actor_label", sa.String(200), nullable=False),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("share_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("shares.id")),
        sa.Column("detail", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_audit_patient_created", "audit_log", ["patient_id", "created_at"])

    op.execute(
        """
        CREATE OR REPLACE FUNCTION prevent_audit_mutation()
        RETURNS trigger AS $$
        BEGIN
            RAISE EXCEPTION 'audit_log is append-only';
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        """
        CREATE TRIGGER audit_log_no_update
        BEFORE UPDATE OR DELETE ON audit_log
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();
        """
    )

    op.create_table(
        "observation_windows",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("observation_name", sa.String(120), nullable=False, unique=True),
        sa.Column("window_days", sa.Integer(), nullable=False),
    )

    op.create_table(
        "medication_interactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("drug_a", sa.String(120), nullable=False),
        sa.Column("drug_b", sa.String(120), nullable=False),
        sa.Column("severity", sa.String(16), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
    )

    op.create_table(
        "allergy_drug_maps",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("allergen", sa.String(120), nullable=False),
        sa.Column("drug_or_class", sa.String(120), nullable=False),
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;")
    op.execute("DROP FUNCTION IF EXISTS prevent_audit_mutation();")
    op.drop_table("allergy_drug_maps")
    op.drop_table("medication_interactions")
    op.drop_table("observation_windows")
    op.drop_index("ix_audit_patient_created", table_name="audit_log")
    op.drop_table("audit_log")
    op.drop_table("shares")
    op.drop_index("ix_records_type", table_name="records")
    op.drop_index("ix_records_patient_date", table_name="records")
    op.drop_table("records")
    op.drop_table("files")
    op.drop_table("patients")
    op.drop_table("users")
    sa.Enum(name="user_role").drop(op.get_bind(), checkfirst=True)
