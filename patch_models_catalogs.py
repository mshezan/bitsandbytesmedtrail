with open("api/app/models.py", "r") as f:
    content = f.read()

new_models = """
class DrugCatalog(Base):
    __tablename__ = "drug_catalog"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    generic_name: Mapped[str] = mapped_column(String, index=True)
    brand_name: Mapped[str] = mapped_column(String, index=True)
    drug_class: Mapped[str] = mapped_column(String)
    strengths: Mapped[dict] = mapped_column(JSONB) # array of strings

class InteractionRule(Base):
    __tablename__ = "interaction_rules"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    drug_a: Mapped[str] = mapped_column(String)
    drug_b: Mapped[str] = mapped_column(String)
    severity: Mapped[str] = mapped_column(String) # high, medium, low
    description: Mapped[str] = mapped_column(String)

class TestCatalog(Base):
    __tablename__ = "test_catalog"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, index=True)
    interval_days: Mapped[int] = mapped_column(Integer) # How often it should be repeated

class Appointment(Base):
    __tablename__ = "appointments"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"))
    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))
    doctor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("staff.id"))
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String) # booked, arrived, completed

class TriageEntry(Base):
    __tablename__ = "triage_entries"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"))
    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"))
    priority: Mapped[int] = mapped_column(Integer) # 1, 2, 3
    chief_complaint: Mapped[str] = mapped_column(String)
    arrival_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
"""

if "class DrugCatalog" not in content:
    content += new_models
    with open("api/app/models.py", "w") as f:
        f.write(content)
