from datetime import date, datetime, timezone
import copy
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field, ConfigDict

from app.deps import CurrentPatient, CurrentUser, SessionDep
from app.models import (
    AuditLog, CorrectionRequest, Notification, Organization, Patient,
    PatientRecordNote, PrivacyRequest, Record, Staff, User,
)

router = APIRouter(tags=["data ownership"])


class SelfReportedCreate(BaseModel):
    record_type: str
    name: str = Field(min_length=1, max_length=200)
    details: str | None = Field(default=None, max_length=2000)
    recorded_date: date = Field(default_factory=date.today)


class SelfReportedUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    details: str | None = Field(default=None, max_length=2000)
    recorded_date: date


class CorrectionCreate(BaseModel):
    record_id: uuid.UUID
    field_name: str = Field(min_length=1, max_length=200)
    believed_correct: str = Field(min_length=1, max_length=2000)
    reason: str = Field(min_length=1, max_length=2000)
    attachment_file_id: uuid.UUID | None = None


class IdentityCorrectionCreate(BaseModel):
    organization_code: str
    field_name: str
    believed_correct: str = Field(min_length=1, max_length=500)
    reason: str = Field(min_length=1, max_length=2000)


class RecordNoteCreate(BaseModel):
    note: str = Field(min_length=1, max_length=4000)


class PrivacyRequestCreate(BaseModel):
    request_type: str
    reason: str = Field(min_length=1, max_length=2000)


class CorrectionReview(BaseModel):
    action: str
    reason: str = Field(min_length=1, max_length=2000)


def _audit(db, patient_id, actor_type, actor_label, action, detail=None):
    db.add(AuditLog(patient_id=patient_id, actor_type=actor_type, actor_label=actor_label,
                    action=action, detail=detail))


@router.post("/correction-attachments", status_code=201)
async def upload_correction_attachment(patient: CurrentPatient, db: SessionDep,
                                      file: UploadFile = File(...)):
    allowed = {"application/pdf": b"%PDF", "image/jpeg": b"\xff\xd8\xff",
               "image/png": b"\x89PNG\r\n\x1a\n"}
    if file.content_type not in allowed:
        raise HTTPException(400, "Attachment must be a PDF, JPEG, or PNG")
    content = await file.read(10 * 1024 * 1024 + 1)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, "Attachment exceeds the 10 MB limit")
    if not content.startswith(allowed[file.content_type]):
        raise HTTPException(400, "Attachment content does not match its declared type")
    from app.storage import minio_client
    from app.config import settings
    from app.models import FileObject
    key = f"correction-attachments/{patient.id}/{uuid.uuid4()}"
    try:
        minio_client().put_object(Bucket=settings.minio_bucket, Key=key, Body=content,
                                  ContentType=file.content_type)
    except Exception:
        raise HTTPException(503, "Document storage is temporarily unavailable")
    row = FileObject(patient_id=patient.id, object_key=key, mime=file.content_type,
                     original_name=(file.filename or "correction-evidence")[:255])
    db.add(row)
    _audit(db, patient.id, "patient", "Self", "Uploaded correction attachment", row.original_name)
    db.commit()
    db.refresh(row)
    return {"file_id": str(row.id), "name": row.original_name}


def _record_label(record: Record) -> str:
    fhir = record.fhir or {}
    for key in ("code", "medicationCodeableConcept"):
        value = fhir.get(key)
        if isinstance(value, dict) and value.get("text"):
            return str(value["text"])
    return str(fhir.get("medication") or fhir.get("observation") or record.type)


@router.get("/self-reported")
def list_self_reported(patient: CurrentPatient, db: SessionDep):
    rows = db.query(Record).filter(Record.patient_id == patient.id,
                                   Record.source_type == "self_reported").order_by(Record.recorded_date.desc()).all()
    return [{"id": str(r.id), "type": r.type, "name": _record_label(r),
             "details": r.fhir.get("note"), "recorded_date": r.recorded_date,
             "status": "Self-reported, not verified"} for r in rows]


@router.post("/self-reported", status_code=201)
def create_self_reported(req: SelfReportedCreate, patient: CurrentPatient, db: SessionDep):
    if req.record_type not in {"symptom", "observation", "condition", "allergy", "medication", "note"}:
        raise HTTPException(422, "Choose a supported self-reported item type")
    record_type = "observation" if req.record_type in {"symptom", "observation", "note"} else req.record_type
    resource = {"resourceType": "PatientReported", "code": {"text": req.name},
                "self_reported": True, "reported_kind": req.record_type, "note": req.details}
    record = Record(patient_id=patient.id, type=record_type, fhir=resource,
                    source_name="Patient-reported", source_type="self_reported",
                    recorded_date=req.recorded_date, confidence=None, verified=False,
                    patient_confirmed=True)
    db.add(record)
    _audit(db, patient.id, "patient", "Self", "Added self-reported item", req.record_type)
    db.commit()
    db.refresh(record)
    return {"id": str(record.id), "status": "Self-reported, not verified"}


@router.patch("/self-reported/{record_id}")
def update_self_reported(record_id: uuid.UUID, req: SelfReportedUpdate,
                         patient: CurrentPatient, db: SessionDep):
    record = db.query(Record).filter(Record.id == record_id, Record.patient_id == patient.id,
                                     Record.source_type == "self_reported").first()
    if not record:
        raise HTTPException(404, "Self-reported item not found")
    record.fhir = {**record.fhir, "code": {"text": req.name}, "note": req.details}
    record.recorded_date = req.recorded_date
    _audit(db, patient.id, "patient", "Self", "Updated self-reported item", str(record.id))
    db.commit()
    return {"status": "updated"}


@router.delete("/self-reported/{record_id}")
def delete_self_reported(record_id: uuid.UUID, patient: CurrentPatient, db: SessionDep):
    record = db.query(Record).filter(Record.id == record_id, Record.patient_id == patient.id,
                                     Record.source_type == "self_reported").first()
    if not record:
        raise HTTPException(404, "Self-reported item not found")
    db.delete(record)
    _audit(db, patient.id, "patient", "Self", "Deleted self-reported item", str(record.id))
    db.commit()
    return {"status": "deleted"}


@router.post("/correction-requests", status_code=201)
def create_correction(req: CorrectionCreate, patient: CurrentPatient, db: SessionDep):
    record = db.query(Record).filter(Record.id == req.record_id, Record.patient_id == patient.id).first()
    if not record:
        raise HTTPException(404, "Record not found")
    if record.source_type in {"upload", "self_reported"}:
        raise HTTPException(422, "Only records issued by a connected provider can be routed for correction")
    if not record.verified:
        raise HTTPException(422, "Unverified records cannot be amended; edit the pending upload or self-report instead")
    preview = copy.deepcopy(record.fhir)
    _set_fhir_path(preview, req.field_name, req.believed_correct)
    if not record.source_org_id:
        source_key = "".join(ch for ch in record.source_name.casefold() if ch.isalnum())
        orgs = db.query(Organization).filter(Organization.status == "active").all()
        org = next((o for o in orgs if "".join(ch for ch in o.name.casefold() if ch.isalnum()) in source_key
                    or source_key in "".join(ch for ch in o.name.casefold() if ch.isalnum())), None)
        if org: record.source_org_id = org.id
    if not record.source_org_id:
        raise HTTPException(422, "This source is not connected to a MedTrail organization inbox. Contact the provider directly.")
    if req.attachment_file_id:
        from app.models import FileObject
        attachment = db.query(FileObject).filter(FileObject.id == req.attachment_file_id,
                                                 FileObject.patient_id == patient.id).first()
        if not attachment:
            raise HTTPException(404, "Attachment not found")
    correction = CorrectionRequest(patient_id=patient.id, record_id=record.id,
        source_org_id=record.source_org_id, request_type="record", field_name=req.field_name,
        believed_correct=req.believed_correct, reason=req.reason, attachment_file_id=req.attachment_file_id)
    db.add(correction)
    _audit(db, patient.id, "patient", "Self", "Flagged a record for correction", f"{record.source_name}: {req.field_name}")
    db.commit()
    db.refresh(correction)
    return {"id": str(correction.id), "status": correction.status}


@router.post("/identity-corrections", status_code=201)
def create_identity_correction(req: IdentityCorrectionCreate, patient: CurrentPatient, db: SessionDep):
    if req.field_name not in {"name", "dob", "sex"}:
        raise HTTPException(422, "Identity correction must target name, date of birth, or sex")
    org = db.query(Organization).filter(Organization.registration_no == req.organization_code,
                                         Organization.status == "active").first()
    if not org:
        raise HTTPException(404, "Reviewing organization not found")
    correction = CorrectionRequest(patient_id=patient.id, source_org_id=org.id,
        request_type="identity", field_name=req.field_name,
        believed_correct=req.believed_correct, reason=req.reason)
    db.add(correction)
    _audit(db, patient.id, "patient", "Self", "Requested identity correction", req.field_name)
    db.commit()
    db.refresh(correction)
    return {"id": str(correction.id), "status": correction.status}


@router.get("/correction-requests")
def list_corrections(patient: CurrentPatient, db: SessionDep):
    rows = db.query(CorrectionRequest, Organization, Record).join(
        Organization, CorrectionRequest.source_org_id == Organization.id
    ).outerjoin(Record, CorrectionRequest.record_id == Record.id).filter(
        CorrectionRequest.patient_id == patient.id
    ).order_by(CorrectionRequest.created_at.desc()).all()
    return [{"id": str(c.id), "type": c.request_type, "record": _record_label(r) if r else None,
             "organization": org.name, "field": c.field_name, "believed_correct": c.believed_correct,
             "reason": c.reason, "status": c.status, "resolution_reason": c.resolution_reason,
             "created_at": c.created_at} for c, org, r in rows]


@router.post("/records/{record_id}/notes", status_code=201)
def add_private_note(record_id: uuid.UUID, req: RecordNoteCreate, patient: CurrentPatient, db: SessionDep):
    record = db.query(Record).filter(Record.id == record_id, Record.patient_id == patient.id).first()
    if not record:
        raise HTTPException(404, "Record not found")
    note = PatientRecordNote(patient_id=patient.id, record_id=record.id, note=req.note)
    db.add(note)
    _audit(db, patient.id, "patient", "Self", "Added a private record note", str(record.id))
    db.commit()
    db.refresh(note)
    return {"id": str(note.id), "note": note.note, "created_at": note.created_at}


@router.get("/records/{record_id}/notes")
def list_private_notes(record_id: uuid.UUID, patient: CurrentPatient, db: SessionDep):
    if not db.query(Record.id).filter(Record.id == record_id, Record.patient_id == patient.id).first():
        raise HTTPException(404, "Record not found")
    return [{"id": str(n.id), "note": n.note, "created_at": n.created_at}
            for n in db.query(PatientRecordNote).filter(PatientRecordNote.patient_id == patient.id,
                PatientRecordNote.record_id == record_id).order_by(PatientRecordNote.created_at.desc()).all()]


class ShareVisibility(BaseModel):
    hidden: bool


@router.patch("/records/{record_id}/share-visibility")
def set_share_visibility(record_id: uuid.UUID, req: ShareVisibility,
                         patient: CurrentPatient, db: SessionDep):
    record = db.query(Record).filter(Record.id == record_id, Record.patient_id == patient.id).first()
    if not record:
        raise HTTPException(404, "Record not found")
    record.hidden_from_shares = req.hidden
    _audit(db, patient.id, "patient", "Self", "Changed record sharing visibility",
           f"Record {record.id}; hidden={req.hidden}")
    db.commit()
    return {"hidden": record.hidden_from_shares}


@router.post("/privacy/requests", status_code=201)
def create_privacy_request(req: PrivacyRequestCreate, patient: CurrentPatient, db: SessionDep):
    if req.request_type != "deletion":
        raise HTTPException(422, "Patients can submit record removal requests")
    row = PrivacyRequest(patient_id=patient.id, request_type="deletion", reason=req.reason)
    db.add(row)
    _audit(db, patient.id, "patient", "Self", "Requested record removal review", req.reason)
    db.commit()
    db.refresh(row)
    return {"id": str(row.id), "status": row.status}


@router.get("/privacy/requests")
def list_privacy_requests(patient: CurrentPatient, db: SessionDep):
    return [{"id": str(r.id), "type": r.request_type, "reason": r.reason,
             "status": r.status, "created_at": r.created_at}
            for r in db.query(PrivacyRequest).filter(PrivacyRequest.patient_id == patient.id)
                .order_by(PrivacyRequest.created_at.desc()).all()]


@router.get("/notifications")
def list_notifications(patient: CurrentPatient, db: SessionDep):
    return [{"id": str(n.id), "title": n.title, "message": n.message,
             "read": n.read_at is not None, "created_at": n.created_at}
            for n in db.query(Notification).filter(Notification.patient_id == patient.id)
                .order_by(Notification.created_at.desc()).all()]


@router.post("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: uuid.UUID, patient: CurrentPatient, db: SessionDep):
    row = db.query(Notification).filter(Notification.id == notification_id,
                                        Notification.patient_id == patient.id).first()
    if not row:
        raise HTTPException(404, "Notification not found")
    row.read_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "read"}


def _staff_for_org(user: User, db, org_id, *, admin_only=False):
    if user.role not in {"hospital_staff", "org_admin"}:
        raise HTTPException(403, "Hospital staff access required")
    staff = db.query(Staff).filter(Staff.user_id == user.id, Staff.org_id == org_id).first()
    if not staff:
        raise HTTPException(403, "You are not authorized for this organization")
    if admin_only and staff.role != "org_admin" and user.role != "org_admin":
        raise HTTPException(403, "Organization administrator approval is required")
    return staff


@router.get("/hospital/inbox/corrections")
def hospital_correction_inbox(user: CurrentUser, db: SessionDep):
    staff = db.query(Staff).filter(Staff.user_id == user.id).first()
    if user.role not in {"hospital_staff", "org_admin"} or not staff:
        raise HTTPException(403, "Hospital staff access required")
    rows = db.query(CorrectionRequest, Patient, User, Record).join(
        Patient, CorrectionRequest.patient_id == Patient.id
    ).join(User, Patient.user_id == User.id).outerjoin(
        Record, CorrectionRequest.record_id == Record.id
    ).filter(CorrectionRequest.source_org_id == staff.org_id).order_by(
        CorrectionRequest.created_at.desc()).all()
    return [{"id": str(c.id), "patient_id": str(p.id), "patient_name": u.name,
             "type": c.request_type, "record_id": str(c.record_id) if c.record_id else None,
             "record": _record_label(r) if r else None, "field": c.field_name,
             "believed_correct": c.believed_correct, "reason": c.reason,
             "status": c.status, "created_at": c.created_at} for c, p, u, r in rows]


def _set_fhir_path(data: dict, path: str, value: str):
    parts = path.split(".")
    if not parts or parts[0] != "fhir" or any(not part.isidentifier() for part in parts):
        raise HTTPException(422, "Correction field must be a valid FHIR field path")
    target = data
    for part in parts[1:-1]:
        child = target.get(part)
        if not isinstance(child, dict):
            raise HTTPException(422, "Correction field does not identify an editable FHIR value")
        target = child
    if parts[-1] not in target:
        raise HTTPException(422, "Correction field does not exist in this record")
    target[parts[-1]] = value


@router.post("/hospital/inbox/corrections/{request_id}/review")
def review_correction(request_id: uuid.UUID, req: CorrectionReview,
                      user: CurrentUser, db: SessionDep):
    correction = db.query(CorrectionRequest).filter(CorrectionRequest.id == request_id).first()
    if not correction:
        raise HTTPException(404, "Correction request not found")
    staff = _staff_for_org(user, db, correction.source_org_id,
                           admin_only=correction.request_type == "identity")
    if correction.status not in {"open", "under_review"}:
        raise HTTPException(409, "This correction request has already been resolved")
    if req.action not in {"under_review", "accepted", "rejected"}:
        raise HTTPException(422, "Choose under_review, accepted, or rejected")

    if req.action == "accepted" and correction.request_type == "record":
        record = db.query(Record).filter(Record.id == correction.record_id,
            Record.patient_id == correction.patient_id, Record.source_org_id == staff.org_id).first()
        if not record:
            raise HTTPException(403, "Only the source organization can amend this record")
        old_data = {"type": record.type, "fhir": record.fhir, "source_name": record.source_name,
                    "recorded_date": record.recorded_date.isoformat(), "status": record.status}
        previous_version = record.current_version
        next_version = previous_version + 1
        updated_fhir = copy.deepcopy(record.fhir)
        _set_fhir_path(updated_fhir, correction.field_name, correction.believed_correct)
        record.fhir = updated_fhir
        record.current_version = next_version
        record.status = "amended"
        new_data = {**old_data, "fhir": record.fhir, "status": "amended"}
        from app.models import RecordVersion
        if not db.query(RecordVersion.id).filter(RecordVersion.record_id == record.id,
                RecordVersion.version == previous_version).first():
            db.add(RecordVersion(record_id=record.id, version=previous_version, data=old_data,
                                 changed_by_staff_id=staff.id, org_id=staff.org_id,
                                 reason=f"Prior version before patient correction: {req.reason}"))
        db.add(RecordVersion(record_id=record.id, version=next_version, data=new_data,
                             changed_by_staff_id=staff.id, org_id=staff.org_id, reason=req.reason))
    elif req.action == "accepted" and correction.request_type == "identity":
        patient = db.query(Patient).filter(Patient.id == correction.patient_id).first()
        identity_user = db.query(User).filter(User.id == patient.user_id).first()
        if correction.field_name == "name":
            identity_user.name = correction.believed_correct
        elif correction.field_name == "sex":
            patient.sex = correction.believed_correct
        else:
            try:
                patient.dob = date.fromisoformat(correction.believed_correct)
            except ValueError:
                raise HTTPException(422, "Date of birth must use YYYY-MM-DD")

    correction.status = req.action
    correction.reviewed_by_staff_id = staff.id
    correction.resolution_reason = req.reason if req.action in {"accepted", "rejected"} else None
    patient = db.query(Patient).filter(Patient.id == correction.patient_id).first()
    if req.action in {"accepted", "rejected"}:
        db.add(Notification(patient_id=patient.id,
            title=f"Correction request {req.action}",
            message=f"{correction.field_name}: {req.reason}"))
    _audit(db, patient.id, "clinician", user.name,
           f"Correction request {req.action}", f"{correction.field_name}; {req.reason}")
    db.commit()
    return {"id": str(correction.id), "status": correction.status}


class AmendRecord(BaseModel):
    fhir: dict
    reason: str = Field(min_length=1, max_length=2000)
    status: str = "amended"
    model_config = ConfigDict(extra="forbid")


@router.post("/hospital/records/{record_id}/amend")
def amend_record(record_id: uuid.UUID, req: AmendRecord, user: CurrentUser, db: SessionDep):
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(404, "Record not found")
    if not record.source_org_id:
        raise HTTPException(403, "This record has no connected source organization")
    staff = _staff_for_org(user, db, record.source_org_id)
    if staff.role not in {"doctor", "org_admin"} and user.role != "org_admin":
        raise HTTPException(403, "Only an authorized clinician at the source organization can amend records")
    if req.status not in {"amended", "entered_in_error"}:
        raise HTTPException(422, "Record status must be amended or entered_in_error")
    old_data = {"type": record.type, "fhir": record.fhir, "source_name": record.source_name,
                "recorded_date": record.recorded_date.isoformat(), "status": record.status}
    next_version = record.current_version + 1
    from app.models import RecordVersion
    if not db.query(RecordVersion.id).filter(RecordVersion.record_id == record.id,
            RecordVersion.version == record.current_version).first():
        db.add(RecordVersion(record_id=record.id, version=record.current_version, data=old_data,
                             changed_by_staff_id=staff.id, org_id=staff.org_id, reason=req.reason))
    record.fhir = req.fhir
    record.status = req.status
    record.current_version = next_version
    new_data = {"type": record.type, "fhir": record.fhir, "source_name": record.source_name,
                "recorded_date": record.recorded_date.isoformat(), "status": record.status}
    db.add(RecordVersion(record_id=record.id, version=next_version, data=new_data,
                         changed_by_staff_id=staff.id, org_id=staff.org_id, reason=req.reason))
    _audit(db, record.patient_id, "clinician", user.name,
           "Record amended" if req.status == "amended" else "Record entered in error",
           f"{staff.role}; {req.reason}")
    db.add(Notification(patient_id=record.patient_id, title="A health record was amended",
                        message=f"{record.source_name} updated a {record.type} record. Reason: {req.reason}"))
    db.commit()
    return {"id": str(record.id), "status": record.status, "version": record.current_version}


@router.get("/records/{record_id}/history")
def record_history(record_id: uuid.UUID, patient: CurrentPatient, db: SessionDep):
    record = db.query(Record).filter(Record.id == record_id, Record.patient_id == patient.id).first()
    if not record:
        raise HTTPException(404, "Record not found")
    from app.models import RecordVersion
    versions = db.query(RecordVersion, Staff, User, Organization).outerjoin(
        Staff, RecordVersion.changed_by_staff_id == Staff.id
    ).outerjoin(User, Staff.user_id == User.id).outerjoin(
        Organization, RecordVersion.org_id == Organization.id
    ).filter(RecordVersion.record_id == record.id).order_by(RecordVersion.version).all()
    if not versions:
        return [{"version": record.current_version,
                 "data": {"type": record.type, "fhir": record.fhir, "source_name": record.source_name,
                          "recorded_date": record.recorded_date, "status": record.status},
                 "reason": "Original record", "created_at": record.created_at}]
    return [{"version": v.version, "data": v.data, "reason": v.reason,
             "created_at": v.created_at, "changed_by": user.name if user else "Original record",
             "organization": organization.name if organization else "Source organization"}
            for v, _staff, user, organization in versions]
