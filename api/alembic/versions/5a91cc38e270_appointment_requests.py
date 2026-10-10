"""Store a reason on patient appointment requests."""

from alembic import op
import sqlalchemy as sa

revision = "5a91cc38e270"
down_revision = ("345bcb71480c", "bb8a8b0493dd")
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("appointments", sa.Column("reason", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("appointments", "reason")
