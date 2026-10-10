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
    address: Mapped[str | None] = mapped_column(Text)
    preferred_hospital: Mapped[str | None] = mapped_column(String(200))
    notification_preferences: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    privacy_preferences: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    profile_photo_url: Mapped[str | None] = mapped_column(String(512))

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
            "source_type IN ('upload','connector','seed','self_reported')",
            name="ck_records_source_type",
        ),
        CheckConstraint("status IN ('active','amended','entered_in_error')", name="ck_records_status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    fhir: Mapped[dict] = mapped_column(JSONB, nullable=False)
    source_name: Mapped[str] = mapped_column(String(200), nullable=False)
    content_hash: Mapped[str | None] = mapped_column(String(64))
    source_id: Mapped[str | None] = mapped_column(String)
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)
    recorded_date: Mapped[date] = mapped_column(Date, nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float)
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    patient_confirmed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    verified_by_staff_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("staff.id"))
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    current_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    hidden_from_shares: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    file_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("files.id"))
    source_org_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organizations.id"))
    created_by_staff_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("staff.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    patient: Mapped[Patient] = relationship(back_populates="records")


class RecordVersion(Base):
    __tablename__ = "record_versions"
    __table_args__ = (UniqueConstraint("record_id", "version", name="uq_record_version"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("records.id"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    changed_by_staff_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("staff.id"))
    org_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organizations.id"))
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CorrectionRequest(Base):
    __tablename__ = "correction_requests"
    __table_args__ = (
        CheckConstraint("request_type IN ('record','identity')", name="ck_correction_request_type"),
        CheckConstraint("status IN ('open','under_review','accepted','rejected')", name="ck_correction_request_status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    record_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("records.id"))
    source_org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    request_type: Mapped[str] = mapped_column(String(32), nullable=False, default="record")
    field_name: Mapped[str] = mapped_column(String(200), nullable=False)
    believed_correct: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    attachment_file_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("files.id"))
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    reviewed_by_staff_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("staff.id"))
    resolution_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PatientRecordNote(Base):
    __tablename__ = "patient_record_notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    record_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("records.id"), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PrivacyRequest(Base):
    __tablename__ = "privacy_requests"
    __table_args__ = (CheckConstraint("request_type IN ('deletion','restriction')", name="ck_privacy_request_type"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    request_type: Mapped[str] = mapped_column(String(32), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


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

class SourceSync(Base):
    __tablename__ = "source_syncs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    records_added: Mapped[int] = mapped_column(Integer, default=0)
    errors: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

class PreVisitBrief(Base):
    __tablename__ = "pre_visit_briefs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), nullable=False)
    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    content_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

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

class IntegrationQueue(Base):
    __tablename__ = "integration_queues"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    queue_type: Mapped[str] = mapped_column(String) # 'dlq', 'mapping_review', 'identity_review'
    source_org_id: Mapped[str] = mapped_column(String)
    payload: Mapped[dict] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(String, default="pending")
    reason: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

class PipelineLog(Base):
    __tablename__ = "pipeline_logs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[str] = mapped_column(String)
    org_id: Mapped[str] = mapped_column(String)
    stage: Mapped[str] = mapped_column(String) # FETCH, PARSE, MAP, VALIDATE, RESOLVE, STORE
    status: Mapped[str] = mapped_column(String) # success, error
    metrics: Mapped[dict] = mapped_column(JSONB)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
