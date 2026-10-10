from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime, timedelta, timezone
from sqlalchemy import func
import uuid
from app.deps import CurrentUser, CurrentPatient, SessionDep
from app.schemas import MeResponse
from app.models import Patient, Record, Consent, Organization, AuditLog

router = APIRouter(tags=["patient"])

class ConsentGrant(BaseModel):
    organization_code: str
    record_types: list[str] = Field(default_factory=lambda: ["condition", "medication", "allergy", "observation"])
    expires_in_hours: int = Field(default=24, ge=1, le=720)

@router.post("/consents")
def grant_consent(req: ConsentGrant, patient: CurrentPatient, db: SessionDep):
    allowed = {"condition", "medication", "allergy", "observation", "encounter", "report"}
    if not req.record_types or not set(req.record_types).issubset(allowed):
        raise HTTPException(422, "Choose valid record categories")
    organization = db.query(Organization).filter(Organization.registration_no == req.organization_code, Organization.status == "active").first()
    if not organization:
        raise HTTPException(404, "Organization code not found")
    consent = Consent(patient_id=patient.id, org_id=organization.id, status="active",
                      scope=",".join(req.record_types),
                      expires_at=datetime.now(timezone.utc) + timedelta(hours=req.expires_in_hours))
    db.add(consent)
    db.commit()
    db.refresh(consent)
    db.add(AuditLog(patient_id=patient.id, actor_type="patient", actor_label="Self",
                    action="Granted provider access", detail=f"{organization.name}; scope: {consent.scope}"))
    db.commit()
    return {"id": consent.id, "organization": organization.name, "scope": req.record_types,
            "expires_at": consent.expires_at}

@router.get("/consents")
def list_consents(patient: CurrentPatient, db: SessionDep):
    rows = db.query(Consent, Organization).join(Organization, Consent.org_id == Organization.id).filter(Consent.patient_id == patient.id).order_by(Consent.expires_at.desc()).all()
    now = datetime.now(timezone.utc)
    return [{"id": c.id, "organization": org.name, "organization_code": org.registration_no,
             "scope": c.scope.split(",") if c.scope else [], "expires_at": c.expires_at,
             "active": c.status == "active" and c.expires_at > now} for c, org in rows]

@router.delete("/consents/{consent_id}")
def revoke_consent(consent_id: uuid.UUID, patient: CurrentPatient, db: SessionDep):
    consent = db.query(Consent).filter(Consent.id == consent_id, Consent.patient_id == patient.id).first()
    if not consent:
        raise HTTPException(404, "Consent not found")
    consent.status = "revoked"
    db.commit()
    db.add(AuditLog(patient_id=patient.id, actor_type="patient", actor_label="Self",
                    action="Revoked provider access", detail=str(consent.org_id)))
    db.commit()
    return {"status": "revoked"}

@router.get("/me", response_model=MeResponse)
def get_me(user: CurrentUser, db: SessionDep):
    patient = None
    if user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == user.id).first()
        
    return {
        "user": user,
        "patient": patient
    }

@router.get("/dashboard")
def get_dashboard(patient: CurrentPatient, db: SessionDep):
    visible = (Record.patient_id == patient.id, Record.verified.is_(True), Record.status != "entered_in_error")
    records_count = db.query(Record).filter(*visible).count()
    sources_count = db.query(Record.source_name).filter(*visible).distinct().count()
    active_meds = db.query(Record).filter(*visible, Record.type == "medication").count()
    open_alerts = len(generate_insights(patient.id, db))

    recent_activity = db.query(Record).filter(*visible).order_by(Record.recorded_date.desc()).limit(6).all()
    activity = [{"id": r.id, "type": r.type, "date": r.recorded_date, "source": r.source_name} for r in recent_activity]

    alerts = generate_insights(patient.id, db)

    sources_query = db.query(Record.source_name, func.max(Record.recorded_date).label("last_sync"), func.count(Record.id).label("count"))\
        .filter(*visible).group_by(Record.source_name).all()
    sources = [{"name": s.source_name, "last_sync": s.last_sync, "count": s.count, "status": "synced"} for s in sources_query]

    return {
        "stat_counts": {
            "records": records_count,
            "sources": sources_count,
            "active_meds": active_meds,
            "open_alerts": open_alerts
        },
        "recent_activity": activity,
        "alerts": alerts,
        "sources": sources
    }

@router.get("/sources")
def get_sources(patient: CurrentPatient, db: SessionDep):
    sources_query = db.query(Record.source_name, func.max(Record.recorded_date).label("last_sync"), func.count(Record.id).label("count"))\
        .filter(Record.patient_id == patient.id, Record.verified.is_(True), Record.status != "entered_in_error").group_by(Record.source_name).all()
    sources = [{"name": s.source_name, "last_sync": s.last_sync, "count": s.count, "status": "synced"} for s in sources_query]
    return sources

@router.get("/visit-prep")
def get_visit_prep(patient: CurrentPatient, db: SessionDep):
    meds = db.query(Record).filter(Record.patient_id == patient.id, Record.type == "medication", Record.verified.is_(True), Record.status != "entered_in_error").all()
    conditions = db.query(Record).filter(Record.patient_id == patient.id, Record.type == "condition", Record.verified.is_(True), Record.status != "entered_in_error").all()
    recent_labs = db.query(Record).filter(Record.patient_id == patient.id, Record.type == "observation", Record.verified.is_(True), Record.status != "entered_in_error").order_by(Record.recorded_date.desc()).limit(5).all()

    def medication_name(record):
        value = record.fhir.get("medicationCodeableConcept", {}).get("text")
        if value:
            return value
        medication = record.fhir.get("medication", "Unknown")
        return medication.get("text", "Unknown") if isinstance(medication, dict) else medication

    return {
        "medications": [{"name": medication_name(m), "status": "active"} for m in meds],
        "conditions": [{"name": c.fhir.get("code", {}).get("text") or c.fhir.get("condition", "Unknown")} for c in conditions],
        "recent_labs": [{"name": l.fhir.get("observation", l.fhir.get("code", {}).get("text", "Unknown")), "value": l.fhir.get("valueQuantity", {}).get("value")} for l in recent_labs],
        "questions_to_ask": []
    }

from app.insights import generate_insights

@router.get("/insights")
def get_insights(patient: CurrentPatient, db: SessionDep):
    from app.insights import generate_insights
    return generate_insights(patient.id, db)
