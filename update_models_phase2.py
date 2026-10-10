import re

with open("api/app/models.py", "r") as f:
    content = f.read()

# Add missing imports if needed
if "from sqlalchemy import Enum" not in content:
    pass # Enum is already imported

# Update UserRole Enum
content = content.replace(
    'patient = "patient"\n    clinician = "clinician"',
    'patient = "patient"\n    hospital_staff = "hospital_staff"\n    org_admin = "org_admin"'
)

# Add new tables at the end
new_tables = """
class Organization(Base):
    __tablename__ = "organizations"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    registration_no: Mapped[str | None] = mapped_column(String(100))
    api_key_hash: Mapped[str | None] = mapped_column(String(128))
    status: Mapped[str] = mapped_column(String(32), default="active")

class Staff(Base):
    __tablename__ = "staff"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(64), nullable=False)
    designation: Mapped[str | None] = mapped_column(String(100))
    license_no: Mapped[str | None] = mapped_column(String(100))

class AccessEvent(Base):
    __tablename__ = "access_events"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    staff_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("staff.id"))
    purpose: Mapped[str] = mapped_column(String(200), nullable=False)
    scope: Mapped[str] = mapped_column(String(64), nullable=False)
    records_viewed: Mapped[int] = mapped_column(Integer, default=0)
    ip: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Consent(Base):
    __tablename__ = "consents"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    scope: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

class ApiKey(Base):
    __tablename__ = "api_keys"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    hash: Mapped[str] = mapped_column(String(128), nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
"""

content += new_tables

# Update Patient table
content = content.replace(
    'emergency_contact: Mapped[str | None] = mapped_column(String(200))\n    abha_number: Mapped[str | None] = mapped_column(String(32))\n    abha_address: Mapped[str | None] = mapped_column(String(128))\n    insurance: Mapped[str | None] = mapped_column(String(128))',
    'emergency_contact: Mapped[str | None] = mapped_column(String(200))\n    abha_number: Mapped[str | None] = mapped_column(String(32))\n    abha_address: Mapped[str | None] = mapped_column(String(128))\n    insurance: Mapped[str | None] = mapped_column(String(128))\n    phone: Mapped[str | None] = mapped_column(String(32))\n    city: Mapped[str | None] = mapped_column(String(100))\n    state: Mapped[str | None] = mapped_column(String(100))\n    language: Mapped[str | None] = mapped_column(String(64))'
)

# Update Record table
content = content.replace(
    'file_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("files.id"))\n    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())',
    'file_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("files.id"))\n    source_org_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organizations.id"))\n    created_by_staff_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("staff.id"))\n    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())'
)

with open("api/app/models.py", "w") as f:
    f.write(content)
