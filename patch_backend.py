import os
import uuid
from datetime import datetime, timedelta, date

# 1. Update Models: Add Adherence, OverdueTestRule, and update Seed Script
models_addition = """
class MedicationAdherence(Base):
    __tablename__ = "medication_adherence"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    medication_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("records.id"), nullable=False)
    scheduled_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    taken: Mapped[bool] = mapped_column(Boolean, default=False)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class OverdueTestRule(Base):
    __tablename__ = "overdue_test_rules"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    test_name: Mapped[str] = mapped_column(String(100), nullable=False)
    condition_trigger: Mapped[str | None] = mapped_column(String(100))
    interval_days: Mapped[int] = mapped_column(Integer, nullable=False)
"""

with open("api/app/models.py", "r") as f:
    content = f.read()
if "class MedicationAdherence" not in content:
    content += "\n" + models_addition
    with open("api/app/models.py", "w") as f:
        f.write(content)

print("Models patched.")
