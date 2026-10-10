import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean, Integer,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    patient = "patient"
    hospital_staff = "hospital_staff"
    org_admin = "org_admin"


class RecordType(str, enum.Enum):
    condition = "condition"
    medication = "medication"
    observation = "observation"
    allergy = "allergy"
    encounter = "encounter"
    report = "report"


class SourceType(str, enum.Enum):
    upload = "upload"
    connector = "connector"
    seed = "seed"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    patient: Mapped["Patient | None"] = relationship(back_populates="user", uselist=False)


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    dob: Mapped[date] = mapped_column(Date, nullable=False)
    sex: Mapped[str] = mapped_column(String(32), nullable=False)
    blood_group: Mapped[str | None] = mapped_column(String(8))
    emergency_contact: Mapped[str | None] = mapped_column(String(200))
    abha_number: Mapped[str | None] = mapped_column(String(32))
    abha_address: Mapped[str | None] = mapped_column(String(128))
    insurance: Mapped[str | None] = mapped_column(String(128))
    phone: Mapped[str | None] = mapped_column(String(32))
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    language: Mapped[str | None] = mapped_column(String(64))

    user: Mapped[User] = relationship(back_populates="patient")
    records: Mapped[list["Record"]] = relationship(back_populates="patient")
    files: Mapped[list["FileObject"]] = relationship(back_populates="patient")
    shares: Mapped[list["Share"]] = relationship(back_populates="patient")


class Record(Base):
    __tablename__ = "records"
    __table_args__ = (
        Index("ix_records_patient_date", "patient_id", "recorded_date"),
        Index("ix_records_type", "type"),
        CheckConstraint(
            "type IN ('condition','medication','observation','allergy','encounter','report')",
            name="ck_records_type",
        ),
        CheckConstraint(
            "source_type IN ('upload','connector','seed')",
            name="ck_records_source_type",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    fhir: Mapped[dict] = mapped_column(JSONB, nullable=False)
    source_name: Mapped[str] = mapped_column(String(200), nullable=False)
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)
    recorded_date: Mapped[date] = mapped_column(Date, nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float)
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    file_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("files.id"))
    source_org_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organizations.id"))
    created_by_staff_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("staff.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    patient: Mapped[Patient] = relationship(back_populates="records")


class FileObject(Base):
    __tablename__ = "files"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    object_key: Mapped[str] = mapped_column(String(512), nullable=False)
    mime: Mapped[str] = mapped_column(String(128), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    patient: Mapped[Patient] = relationship(back_populates="files")


class Share(Base):
    __tablename__ = "shares"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    scope: Mapped[dict] = mapped_column(JSONB, nullable=False)
    pin_hash: Mapped[str | None] = mapped_column(String(128))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    is_emergency: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    patient: Mapped[Patient] = relationship(back_populates="shares")


class AuditLog(Base):
    __tablename__ = "audit_log"
    __table_args__ = (Index("ix_audit_patient_created", "patient_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    actor_type: Mapped[str] = mapped_column(String(32), nullable=False)
    actor_label: Mapped[str] = mapped_column(String(200), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    share_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("shares.id"))
    detail: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ObservationWindow(Base):
    __tablename__ = "observation_windows"
    __table_args__ = (UniqueConstraint("observation_name", name="uq_observation_name"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    observation_name: Mapped[str] = mapped_column(String(120), nullable=False)
    window_days: Mapped[int] = mapped_column(Integer, nullable=False)


class MedicationInteraction(Base):
    __tablename__ = "medication_interactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    drug_a: Mapped[str] = mapped_column(String(120), nullable=False)
    drug_b: Mapped[str] = mapped_column(String(120), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)


class AllergyDrugMap(Base):
    __tablename__ = "allergy_drug_maps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    allergen: Mapped[str] = mapped_column(String(120), nullable=False)
    drug_or_class: Mapped[str] = mapped_column(String(120), nullable=False)


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
