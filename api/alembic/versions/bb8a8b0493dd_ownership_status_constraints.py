"""Constrain ownership workflow states.

Revision ID: bb8a8b0493dd
Revises: aa71f8c0d541
"""

from typing import Sequence, Union

from alembic import op


revision: str = "bb8a8b0493dd"
down_revision: Union[str, None] = "aa71f8c0d541"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint("ck_records_status", "records",
        "status IN ('active','amended','entered_in_error')")
    op.create_check_constraint("ck_correction_request_type", "correction_requests",
        "request_type IN ('record','identity')")
    op.create_check_constraint("ck_correction_request_status", "correction_requests",
        "status IN ('open','under_review','accepted','rejected')")
    op.create_check_constraint("ck_privacy_request_type", "privacy_requests",
        "request_type IN ('deletion','restriction')")


def downgrade() -> None:
    op.drop_constraint("ck_privacy_request_type", "privacy_requests", type_="check")
    op.drop_constraint("ck_correction_request_status", "correction_requests", type_="check")
    op.drop_constraint("ck_correction_request_type", "correction_requests", type_="check")
    op.drop_constraint("ck_records_status", "records", type_="check")
