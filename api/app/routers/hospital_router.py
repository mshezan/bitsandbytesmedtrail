from pydantic import BaseModel, Field
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from datetime import datetime, timezone, date
import uuid
import re
from app.deps import get_db, CurrentUser
from app.models import Appointment, Patient, User, Record, AccessEvent, Staff, AuditLog, Organization


class OrderItem(BaseModel):
    test_name: str = Field(min_length=1, max_length=160)
    priority: str = "Routine"
    reason: str = ""
    fasting: bool = False
    override_reason: str | None = None


class OrderPayload(BaseModel):
    items: list[OrderItem] = Field(min_length=1, max_length=20)


class PrescriptionItem(BaseModel):
    drug: str = Field(min_length=1, max_length=160)
    dose: str = Field(default="", max_length=80)
    route: str = Field(default="Oral", max_length=80)
    freq: str = Field(default="", max_length=80)
    timing: str = Field(default="", max_length=80)
    duration: str = Field(default="", max_length=80)
    instructions: str = Field(default="", max_length=1000)
    problem: str = Field(default="", max_length=160)


class PrescriptionPayload(BaseModel):
    items: list[PrescriptionItem] = Field(min_length=1, max_length=30)


class ReferralPayload(BaseModel):
    organization: str = Field(min_length=1, max_length=200)
    specialty: str = Field(min_length=1, max_length=120)
    reason: str = Field(min_length=3, max_length=3000)
    urgency: str = Field(default="Routine", max_length=40)
    sections: list[str] = Field(default_factory=list)

router = APIRouter(prefix="/hospital", tags=["hospital"])

def get_current_staff(user: CurrentUser, db: Session = Depends(get_db)):
    if user.role not in ["hospital_staff", "org_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    staff = db.query(Staff).filter(Staff.user_id == user.id).first()
    if not staff:
        raise HTTPException(status_code=403, detail="Staff record not found")
    return staff

def clinical_label(value, fallback="Unknown"):
    if isinstance(value, dict):
        return value.get("text") or value.get("display") or fallback
    return value if isinstance(value, str) and value else fallback

def patient_history_entry(record: Record):
    fhir = record.fhir or {}
    def first_concept(value):
        if isinstance(value, list):
            return value[0] if value else None
        return value
    label = clinical_label(fhir.get("code"), "")
    if not label:
        label = clinical_label(fhir.get("medicationCodeableConcept"), "")
    if not label:
        label = clinical_label(fhir.get("medication"), "")
    if not label:
        label = clinical_label(first_concept(fhir.get("type")), "")
    if not label:
        label = clinical_label(first_concept(fhir.get("reasonCode")), "")
    if not label:
        label = clinical_label(fhir.get("title"), record.type.title())
    quantity = fhir.get("valueQuantity")
    if isinstance(quantity, dict) and quantity.get("value") is not None:
        detail = f"{quantity['value']} {quantity.get('unit') or ''}".strip()
    else:
        detail = fhir.get("conclusion") or ""
    if not detail and fhir.get("dosageInstruction"):
        detail = clinical_label(first_concept(fhir.get("dosageInstruction")), "")
    if not detail and fhir.get("dosage"):
        detail = clinical_label(first_concept(fhir.get("dosage")), "")
    return {"id": str(record.id), "type": record.type, "label": label, "detail": detail,
        "source_name": record.source_name, "recorded_date": str(record.recorded_date),
        "resource_type": fhir.get("resourceType"), "status": record.status}

@router.get("/search")
def search_patients(q: str = Query(""), staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    query = q.strip()
    base = db.query(Patient).join(User)
    if not query:
        recent_ids = [row[0] for row in db.query(AccessEvent.patient_id).filter(
            AccessEvent.staff_id == staff.id
        ).order_by(AccessEvent.created_at.desc()).limit(30).all()]
        appointment_ids = [row[0] for row in db.query(Appointment.patient_id).filter(
            Appointment.doctor_id == staff.id
        ).order_by(Appointment.time.desc()).limit(30).all()]
        ordered_ids = list(dict.fromkeys(recent_ids + appointment_ids))
        patients = base.filter(Patient.id.in_(ordered_ids)).all() if ordered_ids else []
        by_id = {p.id: p for p in patients}
        patients = [by_id[patient_id] for patient_id in ordered_ids if patient_id in by_id]
        if len(patients) < 10:
            fallback = base.order_by(User.created_at.desc()).limit(20).all()
            existing = {p.id for p in patients}
            patients.extend(p for p in fallback if p.id not in existing)
        patients = patients[:20]
    else:
        q_clean = re.sub(r"\D", "", query)
        phone_digits = func.regexp_replace(User.phone, r"\D", "", "g")
        filters = [User.name.ilike(f"%{query}%"), Patient.abha_number.ilike(f"%{query}%")]
        if q_clean:
            filters.append(phone_digits.like(f"{q_clean}%"))
        else:
            filters.append(User.phone.ilike(f"%{query}%"))
        patients = base.filter(or_(*filters)).order_by(User.name.asc()).limit(20).all()

    res = []
    for p in patients:
        res.append({
            "id": p.id,
            "name": p.user.name if p.user else "Unknown",
            "abha": p.abha_number,
            "phone": p.user.phone if p.user else None,
            "city": p.city,
            "sex": p.sex or "U",
            "dob": p.dob
        })
    return res

@router.post("/patient/{patient_id}/access")
def log_access(patient_id: uuid.UUID, purpose: str = Query(..., min_length=3, max_length=200), staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    evt = AccessEvent(
        id=uuid.uuid4(),
        patient_id=patient_id,
        org_id=staff.org_id,
        staff_id=staff.id,
        purpose=purpose,
        scope="all clinical records"
    )
    db.add(evt)
    db.commit()
    return {"status": "logged", "access_id": evt.id}

@router.get("/patient/{patient_id}")
def get_patient_summary(patient_id: uuid.UUID, staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
        
    allowed_types = ["condition", "medication", "allergy", "observation", "encounter", "report"]
    records = [record for record in db.query(Record).filter(Record.patient_id == patient_id,
        Record.verified.is_(True), Record.status != "entered_in_error").all()
        if record.fhir.get("resourceType") != "ServiceRequest"]
    history = db.query(Record).filter(Record.patient_id == patient_id,
        Record.verified.is_(True), Record.status != "entered_in_error").order_by(
        Record.recorded_date.desc(), Record.created_at.desc()).limit(250).all()
    db.add(AccessEvent(patient_id=p.id, org_id=staff.org_id, staff_id=staff.id,
                       purpose="Viewed patient medical record", scope="all clinical records",
                       records_viewed=len(records)))
    db.commit()
    age = date.today().year - p.dob.year - ((date.today().month, date.today().day) < (p.dob.month, p.dob.day))
    
    pending_uploads = db.query(Record).filter(
        Record.patient_id == patient_id, Record.source_type == "upload",
        Record.patient_confirmed.is_(True), Record.verified.is_(False),
        Record.type.in_(allowed_types)
    ).order_by(Record.recorded_date.desc()).all()

    return {
        "id": p.id,
        "name": p.user.name,
        "abha": p.abha_number,
        "age": age,
        "blood_group": p.blood_group,
        "allergies": [clinical_label(r.fhir.get("code")) if r.fhir.get("code") else clinical_label(r.fhir.get("allergy")) for r in records if r.type == "allergy"],
        "conditions": [clinical_label(r.fhir.get("code")) if r.fhir.get("code") else clinical_label(r.fhir.get("condition")) for r in records if r.type == "condition"],
        "medications": [clinical_label(r.fhir.get("medicationCodeableConcept")) if r.fhir.get("medicationCodeableConcept") else clinical_label(r.fhir.get("medication")) for r in records if r.type == "medication"],
        "observations": [{"date": r.recorded_date, "name": clinical_label(r.fhir.get("code"), "Observation"), "value": (r.fhir.get("valueQuantity") or {}).get("value") if isinstance(r.fhir.get("valueQuantity"), dict) else r.fhir.get("valueQuantity"), "unit": (r.fhir.get("valueQuantity") or {}).get("unit") if isinstance(r.fhir.get("valueQuantity"), dict) else None} for r in records if r.type == "observation"],
        "records_count": len(records), "scope": allowed_types,
        "history": [patient_history_entry(record) for record in history],
        "can_amend": staff.role in {"doctor", "org_admin"},
        "amendable_records": [{"id": str(r.id), "type": r.type, "fhir": r.fhir,
                               "recorded_date": r.recorded_date, "status": r.status}
                              for r in records if r.source_org_id == staff.org_id],
        "pending_uploads": [{"id": str(r.id), "type": r.type, "fhir": r.fhir,
                             "source_name": r.source_name, "recorded_date": r.recorded_date}
                            for r in pending_uploads]
    }


@router.post("/patient/{patient_id}/records/{record_id}/verify-upload")
def verify_patient_upload(patient_id: uuid.UUID, record_id: uuid.UUID,
                          staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    if staff.role not in {"doctor", "org_admin"}:
        raise HTTPException(403, "Only a clinician or organization administrator can verify patient uploads")
    record = db.query(Record).filter(Record.id == record_id, Record.patient_id == patient_id,
        Record.source_type == "upload", Record.patient_confirmed.is_(True),
        Record.verified.is_(False)).first()
    if not record:
        raise HTTPException(404, "Confirmed patient upload not found")
    from app.models import Appointment, AuditLog
    actor = db.query(User).filter(User.id == staff.user_id).first()
    record.verified = True
    record.verified_by_staff_id = staff.id
    db.add(AccessEvent(patient_id=patient_id, org_id=staff.org_id, staff_id=staff.id,
        purpose="Verified patient-uploaded record", scope=record.type, records_viewed=1))
    db.add(AuditLog(patient_id=patient_id, actor_type="clinician",
        actor_label=actor.name if actor else "Clinician", action="Verified patient upload",
        detail=f"{record.source_name}; {record.type}"))
    db.commit()
    return {"id": str(record.id), "verified": True}


@router.get("/my-day")
def get_my_day(staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    staff_user = db.query(User).filter(User.id == staff.user_id).first()
    organization = db.query(Organization).filter(Organization.id == staff.org_id).first()
    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == staff.id
    ).order_by(Appointment.time).limit(100).all()
    
    schedule = []
    
    if appointments:
        for a in appointments:
            p = db.query(Patient).filter(Patient.id == a.patient_id).first()
            if not p: continue
            u = p.user
            schedule.append({
                "id": str(p.id),
                "apt_id": str(a.id),
                "time": a.time.strftime("%I:%M %p"),
                "datetime": a.time.isoformat(),
                "date": a.time.date().isoformat(),
                "patient_name": u.name if u else "Unknown",
                "age": date.today().year - p.dob.year - ((date.today().month, date.today().day) < (p.dob.month, p.dob.day)),
                "sex": p.sex,
                "reason": a.reason or "Appointment",
                "status": str(a.status or "Scheduled").replace("_", " ").title(),
                "flags": []
            })
    recent_patient_ids = [row[0] for row in db.query(AccessEvent.patient_id).filter(
        AccessEvent.staff_id == staff.id).order_by(AccessEvent.created_at.desc()).limit(30).all()]
    recent_patient_ids += [row[0] for row in db.query(Appointment.patient_id).filter(
        Appointment.doctor_id == staff.id).order_by(Appointment.time.desc()).limit(30).all()]
    recent_ids = list(dict.fromkeys(recent_patient_ids))
    recent_patients = db.query(Patient).filter(Patient.id.in_(recent_ids)).all() if recent_ids else []
    by_id = {patient.id: patient for patient in recent_patients}
    recent_patients = [by_id[patient_id] for patient_id in recent_ids if patient_id in by_id]
    if len(recent_patients) < 10:
        fallback = db.query(Patient).join(User).order_by(User.created_at.desc()).limit(20).all()
        known_ids = {patient.id for patient in recent_patients}
        recent_patients.extend(patient for patient in fallback if patient.id not in known_ids)
    recent_patients = recent_patients[:10]
    result_count = db.query(Record.id).filter(Record.source_org_id == staff.org_id,
        Record.type == "observation", Record.verified.is_(True), Record.status != "entered_in_error",
        Record.fhir["resourceType"].astext != "ServiceRequest").count()

    return {
        "doctor_name": staff_user.name if staff_user else "Doctor",
        "doctor_designation": staff.designation or "Endocrinology",
        "clinic": organization.name if organization else "Hospital",
        "clinic_city": (organization.city if organization and organization.city else "Chennai"),
        "stats": {
            "patients_today": len([s for s in schedule if s.get("date") == date.today().isoformat()]),
            "waiting_now": len([s for s in schedule if s.get("date") == date.today().isoformat() and s['status'].lower() in ['waiting', 'arrived']]),
            "results_review": result_count,
            "open_alerts": 0,
            "network_records_week": db.query(Record.id).filter(Record.patient_id.in_(
                db.query(AccessEvent.patient_id).filter(AccessEvent.staff_id == staff.id)),
                Record.source_org_id != staff.org_id, Record.verified.is_(True)).count(),
            "network_alerts": 0,
            "repeat_tests_avoided": 0
        },
        "schedule": schedule,
        "recent_patients": [{"id": str(p.id), "name": p.user.name if p.user else "Unknown",
            "phone": p.user.phone if p.user else None, "city": p.city} for p in recent_patients],
        "needs_attention": [],
        "activity_feed": []
    }
@router.get("/patient/{patient_id}/workspace")
def get_consult_workspace(patient_id: uuid.UUID, staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
    allowed_types = ["condition", "medication", "allergy", "observation", "encounter", "report"]
    records = db.query(Record).filter(
        Record.patient_id == patient_id, Record.type.in_(allowed_types),
        Record.verified.is_(True), Record.status != "entered_in_error"
    ).all()
    records = [record for record in records if record.fhir.get("resourceType") != "ServiceRequest"]
    history = db.query(Record).filter(Record.patient_id == patient_id,
        Record.verified.is_(True), Record.status != "entered_in_error").order_by(
        Record.recorded_date.desc(), Record.created_at.desc()).limit(250).all()
    db.add(AccessEvent(patient_id=patient_id, org_id=staff.org_id, staff_id=staff.id,
        purpose="Viewed patient clinical chart", scope="all clinical records", records_viewed=len(records)))
    db.commit()
    orgs_count = len(set(r.source_org_id for r in records if r.source_org_id))
    
    age = date.today().year - p.dob.year - ((date.today().month, date.today().day) < (p.dob.month, p.dob.day))
    
    # Allergies
    allergies = []
    for r in records:
        if r.type == "allergy":
            name = clinical_label(r.fhir.get("code")) if r.fhir.get("code") else clinical_label(r.fhir.get("allergy"))
            allergies.append({"name": name, "severity": "high" if "penicillin" in str(name).lower() else "medium", "org": r.source_name})
            
    # Conditions
    conditions = []
    for r in records:
        if r.type == "condition":
            name = clinical_label(r.fhir.get("code")) if r.fhir.get("code") else clinical_label(r.fhir.get("condition"))
            conditions.append({"name": name, "onset": r.fhir.get("onsetDateTime") or str(r.recorded_date), "org": r.source_name})
            
    # Meds
    meds = []
    for r in records:
        if r.type == "medication":
            name = clinical_label(r.fhir.get("medicationCodeableConcept")) if r.fhir.get("medicationCodeableConcept") else clinical_label(r.fhir.get("medication"))
            dosage = r.fhir.get("dosageInstruction") or r.fhir.get("dosage") or []
            dose = clinical_label(dosage[0], "Unknown") if isinstance(dosage, list) and dosage else "Unknown"
            meds.append({"name": name, "dose": dose, "freq": "Daily", "org": r.source_name, "start": str(r.recorded_date)})
            
    # Key Labs
    labs = []
    for r in records:
        if r.type == "observation" and r.fhir.get("resourceType") != "ServiceRequest" and "BP" not in str(r.fhir):
            name = clinical_label(r.fhir.get("code"), "Observation")
            val = (r.fhir.get("valueQuantity") or {}).get("value") if isinstance(r.fhir.get("valueQuantity"), dict) else r.fhir.get("valueQuantity")
            unit = (r.fhir.get("valueQuantity") or {}).get("unit", "") if isinstance(r.fhir.get("valueQuantity"), dict) else ""
            if val is not None: val = f"{val} {unit}".strip()
            labs.append({"name": name, "value": val, "date": str(r.recorded_date), "trend": "stable", "org": r.source_name})
            
    return {
        "header": {
            "name": p.user.name,
            "age": age,
            "sex": p.sex,
            "abha": p.abha_number,
            "blood_group": p.blood_group,
            "city": p.city,
            "phone": p.user.phone,
            "orgs_count": orgs_count,
            "last_updated": "2 days ago"
        },
        "allergies": allergies,
        "conditions": conditions,
        "medications": meds,
        "labs": labs[:5], # key labs
        "history": [patient_history_entry(record) for record in history],
        "vitals": [
            {"name": "BP", "value": "120/80", "date": "Today", "org": "Kaveri"},
            {"name": "SpO2", "value": "98%", "date": "Today", "org": "Kaveri"}
        ]
    }


@router.get("/patient/{patient_id}/brief")
def get_consult_brief(patient_id: uuid.UUID, force_regenerate: bool = Query(False),
                      staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    allowed_types = ["condition", "medication", "allergy", "observation", "encounter", "report"]
    records = db.query(Record).filter(Record.patient_id == patient_id,
        Record.type.in_(allowed_types), Record.verified.is_(True), Record.status != "entered_in_error").order_by(
        Record.recorded_date.desc()).limit(100).all()
    db.add(AccessEvent(patient_id=patient_id, org_id=staff.org_id, staff_id=staff.id,
        purpose="Viewed patient clinical brief", scope="all clinical records", records_viewed=len(records)))
    db.commit()

    def record_name(record):
        if record.type == "medication":
            return clinical_label(record.fhir.get("medicationCodeableConcept") or record.fhir.get("medication"), "Medication")
        if record.type == "observation":
            return clinical_label(record.fhir.get("code"), "Lab observation")
        if record.type == "condition":
            return clinical_label(record.fhir.get("code") or record.fhir.get("condition"), "Condition")
        if record.type == "allergy":
            return clinical_label(record.fhir.get("code") or record.fhir.get("allergy"), "Allergy")
        return clinical_label(record.fhir.get("title") or record.fhir.get("code"), record.type.title())

    grouped = {kind: [record for record in records if record.type == kind]
        for kind in {"condition", "medication", "allergy", "observation"}}
    changes = [{"text": f"{record.type.title()} record: {record_name(record)} ({record.recorded_date}) · {record.source_name}",
        "citations": [str(record.id)]} for record in records[:8]]
    issues = [{"text": f"Recorded {kind}: {record_name(record)}. Confirm current status and details with the patient.",
        "citations": [str(record.id)]} for kind in ("allergy", "medication") for record in grouped[kind][:8]]
    suggestions = []
    if not grouped["medication"]:
        suggestions.append({"text": "No verified medication record is available; confirm current medicines and doses with the patient.", "citations": []})
    if not grouped["allergy"]:
        suggestions.append({"text": "No verified allergy record is available; ask the patient about allergies.", "citations": []})
    if not suggestions:
        suggestions.append({"text": "Confirm current medication use, doses, and allergies with the patient before making care decisions.", "citations": []})
    return {
        "summary": f"The shared history contains {len(records)} verified record(s): {len(grouped['condition'])} condition(s), {len(grouped['medication'])} medication record(s), {len(grouped['allergy'])} allergy record(s), and {len(grouped['observation'])} observation(s). This is a factual record summary, not a diagnosis.",
        "changes_since_last": changes,
        "open_issues": issues,
        "suggestions": suggestions,
        "questions": ["Are you taking each listed medication now, and at what dose?", "Have any allergies or reactions changed?", "Were any recent tests or visits not included in these records?"]
    }
@router.post("/patient/{patient_id}/order")
def place_order(patient_id: uuid.UUID, payload: OrderPayload, staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    if staff.role not in {"doctor", "org_admin"}:
        raise HTTPException(403, "Only clinicians can place orders")
    org = db.query(Organization).filter(Organization.id == staff.org_id).first()
    if not db.query(Patient.id).filter(Patient.id == patient_id).first():
        raise HTTPException(404, "Patient not found")
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    for item in payload.items:
        fhir_payload = {
            "resourceType": "ServiceRequest",
            "status": "active",
            "intent": "order",
            "identifier": [{"value": order_id}],
            "priority": item.priority.lower(),
            "code": {"text": item.test_name},
            "reasonCode": [{"text": item.reason}],
            "note": [{"text": f"Fasting: {item.fasting}. Override Reason: {item.override_reason or 'N/A'}"}]
        }
        db.add(Record(
            patient_id=patient_id,
            source_org_id=staff.org_id,
            source_name=org.name if org else "Hospital",
            source_type="connector",
            created_by_staff_id=staff.id,
            type="observation",
            fhir=fhir_payload,
            recorded_date=date.today(),
            verified=True,
            verified_by_staff_id=staff.id,
            status="active"
        ))
    db.add(AccessEvent(patient_id=patient_id, org_id=staff.org_id, staff_id=staff.id,
        purpose="Placed diagnostic order", scope="observation", records_viewed=0))
    db.commit()
    return {"status": "success", "order_id": order_id}


@router.post("/patient/{patient_id}/prescription")
def create_prescription(patient_id: uuid.UUID, payload: PrescriptionPayload,
                        staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    if staff.role not in {"doctor", "org_admin"}:
        raise HTTPException(403, "Only clinicians can issue prescriptions")
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    org = db.query(Organization).filter(Organization.id == staff.org_id).first()
    rx_id = f"RX-{uuid.uuid4().hex[:8].upper()}"
    for item in payload.items:
        db.add(Record(patient_id=patient_id, type="medication", source_type="connector",
            source_org_id=staff.org_id, source_name=org.name if org else "Hospital",
            created_by_staff_id=staff.id, verified_by_staff_id=staff.id, verified=True,
            status="active", recorded_date=date.today(),
            fhir={"resourceType": "MedicationRequest", "status": "active", "intent": "order",
                "identifier": [{"value": rx_id}], "medicationCodeableConcept": {"text": item.drug},
                "dosageInstruction": [{"text": " · ".join(v for v in [item.dose, item.route, item.freq, item.timing, item.duration] if v)}],
                "note": [{"text": item.instructions}] if item.instructions else [],
                "reasonCode": [{"text": item.problem}] if item.problem else []}))
    db.add(AccessEvent(patient_id=patient_id, org_id=staff.org_id, staff_id=staff.id,
        purpose="Issued prescription", scope="medication", records_viewed=0))
    db.commit()
    return {"status": "success", "rx_id": rx_id}


@router.get("/prescriptions")
def list_prescriptions(staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    rows = db.query(Record, Patient, User).join(Patient, Record.patient_id == Patient.id).join(
        User, Patient.user_id == User.id).filter(Record.source_org_id == staff.org_id,
        Record.type == "medication", Record.fhir["resourceType"].astext == "MedicationRequest",
        Record.status != "entered_in_error").order_by(Record.recorded_date.desc(), Record.created_at.desc()).limit(100).all()
    return [{"id": str(record.id), "patient_id": str(patient.id), "patient_name": user.name,
        "medication": clinical_label(record.fhir.get("medicationCodeableConcept")),
        "dose": (record.fhir.get("dosageInstruction") or [{}])[0].get("text", ""),
        "status": record.fhir.get("status", "active"), "date": str(record.recorded_date),
        "rx_id": ((record.fhir.get("identifier") or [{}])[0]).get("value", "")}
        for record, patient, user in rows]


@router.post("/patient/{patient_id}/referral")
def create_referral(patient_id: uuid.UUID, payload: ReferralPayload,
                    staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    if staff.role not in {"doctor", "org_admin"}:
        raise HTTPException(403, "Only clinicians can send referrals")
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    org = db.query(Organization).filter(Organization.id == staff.org_id).first()
    clinician = db.query(User).filter(User.id == staff.user_id).first()
    referral_id = f"REF-{uuid.uuid4().hex[:8].upper()}"
    db.add(Record(patient_id=patient_id, type="report", source_type="connector",
        source_org_id=staff.org_id, source_name=org.name if org else "Hospital",
        created_by_staff_id=staff.id, verified_by_staff_id=staff.id, verified=True,
        status="active", recorded_date=date.today(),
        fhir={"resourceType": "ServiceRequest", "category": "referral", "status": "active",
            "identifier": [{"value": referral_id}], "performer": [{"display": payload.organization}],
            "specialty": payload.specialty, "priority": payload.urgency.lower(), "reasonCode": [{"text": payload.reason}],
            "supportingInfo": payload.sections, "requester": {"display": clinician.name if clinician else "Clinician"}}))
    db.add(AccessEvent(patient_id=patient_id, org_id=staff.org_id, staff_id=staff.id,
        purpose="Sent referral", scope="report", records_viewed=0))
    db.commit()
    return {"status": "success", "referral_id": referral_id}


@router.get("/referrals")
def list_referrals(staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    rows = db.query(Record, Patient, User).join(Patient, Record.patient_id == Patient.id).join(
        User, Patient.user_id == User.id).filter(Record.source_org_id == staff.org_id,
        Record.type == "report", Record.fhir["category"].astext == "referral",
        Record.status != "entered_in_error").order_by(Record.recorded_date.desc(), Record.created_at.desc()).limit(100).all()
    return [{"id": str(record.id), "patient_id": str(patient.id), "patient_name": user.name,
        "referral_id": ((record.fhir.get("identifier") or [{}])[0]).get("value", ""),
        "organization": ((record.fhir.get("performer") or [{}])[0]).get("display", ""),
        "specialty": record.fhir.get("specialty", ""),
        "reason": ((record.fhir.get("reasonCode") or [{}])[0]).get("text", ""),
        "urgency": record.fhir.get("priority", "routine"), "status": record.fhir.get("status", "active"),
        "date": str(record.recorded_date)} for record, patient, user in rows]

@router.get("/inbox")
def get_inbox(staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    from app.models import CorrectionRequest
    result_rows = db.query(Record, Patient, User).join(Patient, Record.patient_id == Patient.id).join(
        User, Patient.user_id == User.id).filter(
        Record.type == "observation", Record.verified.is_(True), Record.status != "entered_in_error",
        or_(Record.fhir["resourceType"].astext.is_(None), Record.fhir["resourceType"].astext != "ServiceRequest")).order_by(
        Record.recorded_date.desc(), Record.created_at.desc()).limit(100).all()
    result_ids = [record.id for record, _, _ in result_rows]
    acknowledged = set()
    if result_ids:
        ack_rows = db.query(AuditLog.detail).filter(AuditLog.action == "Acknowledged clinical result",
            AuditLog.actor_label == str(staff.id)).all()
        acknowledged = {row[0].split("record_id=", 1)[1] for row in ack_rows if row[0] and "record_id=" in row[0]}
    results = []
    for record, patient, user in result_rows:
        quantity = record.fhir.get("valueQuantity") or {}
        value = quantity.get("value", record.fhir.get("valueString", "Result available")) if isinstance(quantity, dict) else quantity
        unit = quantity.get("unit", "") if isinstance(quantity, dict) else ""
        interpretation = record.fhir.get("interpretation") or []
        flag = "abnormal" if interpretation else "review"
        results.append({"id": str(record.id), "patient_id": str(patient.id), "patient_name": user.name,
            "test": clinical_label(record.fhir.get("code"), "Lab result"),
            "value": f"{value} {unit}".strip(), "flag": flag, "previous_value": None,
            "date": str(record.recorded_date), "acknowledged": str(record.id) in acknowledged})
        db.add(AccessEvent(patient_id=patient.id, org_id=staff.org_id, staff_id=staff.id,
            purpose="Viewed lab result from clinician inbox", scope="observation", records_viewed=1))
    order_rows = db.query(Record, Patient, User).join(Patient, Record.patient_id == Patient.id).join(
        User, Patient.user_id == User.id).filter(Record.source_org_id == staff.org_id,
        Record.type == "observation", Record.fhir["resourceType"].astext == "ServiceRequest",
        Record.fhir["category"].astext.is_(None), Record.status != "entered_in_error").order_by(
        Record.recorded_date.desc(), Record.created_at.desc()).limit(100).all()
    orders = []
    for record, patient, user in order_rows:
        request = record.fhir
        orders.append({"id": ((request.get("identifier") or [{}])[0]).get("value", str(record.id)[:8]),
            "record_id": str(record.id), "patient_id": str(patient.id), "patient_name": user.name,
            "test": clinical_label(request.get("code"), "Diagnostic order"),
            "status": request.get("status", "active"), "priority": request.get("priority", "routine"),
            "date": str(record.recorded_date)})
    corrections = db.query(CorrectionRequest, Patient, User, Record).join(
        Patient, CorrectionRequest.patient_id == Patient.id).join(User, Patient.user_id == User.id).outerjoin(
        Record, CorrectionRequest.record_id == Record.id).filter(
        CorrectionRequest.source_org_id == staff.org_id).order_by(CorrectionRequest.created_at.desc()).limit(100).all()
    corrections_out = [{"id": str(c.id), "patient_id": str(patient.id), "patient_name": user.name,
        "record_id": str(c.record_id) if c.record_id else None, "disputed_field": c.field_name,
        "record": clinical_label(record.fhir.get("code")) if record else None,
        "patient_comment": c.reason, "believed_correct": c.believed_correct,
        "status": c.status, "date": str(c.created_at)} for c, patient, user, record in corrections]
    if result_rows:
        db.commit()
    return {"results": results, "orders": orders, "corrections": corrections_out}

@router.post("/inbox/{result_id}/acknowledge")
def acknowledge_result(result_id: str, staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    try:
        record_uuid = uuid.UUID(result_id)
    except ValueError:
        raise HTTPException(404, "Result not found")
    record = db.query(Record).filter(Record.id == record_uuid,
        Record.type == "observation", Record.verified.is_(True), Record.status != "entered_in_error").first()
    if not record:
        raise HTTPException(404, "Result not found")
    already = db.query(AuditLog.id).filter(AuditLog.patient_id == record.patient_id,
        AuditLog.actor_label == str(staff.id), AuditLog.action == "Acknowledged clinical result",
        AuditLog.detail == f"record_id={record.id}").first()
    if not already:
        db.add(AuditLog(patient_id=record.patient_id, actor_type="clinician", actor_label=str(staff.id),
            action="Acknowledged clinical result", detail=f"record_id={record.id}"))
        db.add(AccessEvent(patient_id=record.patient_id, org_id=staff.org_id, staff_id=staff.id,
            purpose="Acknowledged clinical result", scope="observation", records_viewed=1))
        db.commit()
    return {"status": "acknowledged"}

class NotePayload(BaseModel):
    title: str
    content: str
    template: str

@router.post("/patient/{patient_id}/note")
def save_clinical_note(patient_id: uuid.UUID, payload: NotePayload, staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    from app.models import Appointment, Record, AccessEvent
    org = db.query(Organization).filter(Organization.id == staff.org_id).first()
    
    fhir_payload = {
        "resourceType": "ClinicalImpression",
        "status": "completed",
        "summary": payload.title,
        "description": payload.content,
        "note": [{"text": f"Template used: {payload.template}"}]
    }
    
    r = Record(
        id=uuid.uuid4(),
        patient_id=patient_id,
        source_org_id=staff.org_id,
        source_name=org.name if org else "Hospital",
        type="clinical_note",
        fhir=fhir_payload,
        recorded_date=datetime.now(timezone.utc),
        verified=True,
        verified_by_staff_id=staff.id,
        status="active"
    )
    db.add(r)
    
    db.add(AccessEvent(
        patient_id=patient_id, org_id=staff.org_id, staff_id=staff.id,
        purpose="Wrote clinical note", scope="clinical_note", records_viewed=0
    ))
    
    db.commit()
    return {"status": "success", "note_id": str(r.id)}

@router.get("/analytics")
def get_analytics(staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    from app.models import Appointment, Record, AccessEvent, Patient
    total_patients = db.query(Patient).count()
    total_records = db.query(Record).count()
    
    # Mock some realistic computations for the prototype
    duplicates_avoided = int(total_records * 0.15)
    savings = duplicates_avoided * 450 # Avg 450 Rs per lab test
    interactions_caught = int(total_patients * 0.8)
    
    return {
        "rupees_saved": savings,
        "duplicates_avoided": duplicates_avoided,
        "interactions_caught": interactions_caught,
        "records_unified": total_records,
        "avg_time_to_history": "12 seconds",
        "corrections_resolved": 14,
        "monthly_savings": [
            {"name": "Jan", "savings": 12000},
            {"name": "Feb", "savings": 15000},
            {"name": "Mar", "savings": 18000},
            {"name": "Apr", "savings": 22000},
            {"name": "May", "savings": savings},
        ]
    }

@router.get("/insights/population")
def get_population_insights(staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    # Only return evidence-based alerts. The former mocked list reused one patient
    # ID for unrelated names, sending every Open Chart action to the same chart.
    patients = db.query(Patient, User).join(User, Patient.user_id == User.id).order_by(User.name.asc()).all()
    records_by_patient = {}
    patient_ids = [patient.id for patient, _ in patients]
    if patient_ids:
        records = db.query(Record).filter(
            Record.patient_id.in_(patient_ids),
            Record.verified.is_(True),
            Record.status != "entered_in_error",
        ).all()
        for record in records:
            records_by_patient.setdefault(record.patient_id, []).append(record)
    alerts = []
    for patient, user in patients:
        records = records_by_patient.get(patient.id, [])
        for record in records:
            fhir = record.fhir or {}
            if record.type == "allergy":
                allergy = fhir.get("code") or {}
                allergy_name = allergy.get("text", "Documented allergy") if isinstance(allergy, dict) else str(allergy)
                reaction = ""
                try:
                    reaction = fhir["reaction"][0]["manifestation"][0].get("text", "")
                except (KeyError, IndexError, TypeError):
                    pass
                alerts.append({
                    "id": str(record.id), "patient": user.name, "patient_id": str(patient.id),
                    "risk": "High", "type": "Documented Allergy",
                    "detail": f"{allergy_name}{f' — {reaction}' if reaction else ''}",
                })
        medication_sources = {}
        for record in records:
            if record.type != "medication":
                continue
            concept = (record.fhir or {}).get("medicationCodeableConcept") or {}
            medication = concept.get("text") if isinstance(concept, dict) else str(concept)
            if medication:
                medication_sources.setdefault(medication.casefold(), {"name": medication, "sources": set()})["sources"].add(record.source_org_id or record.source_name)
        for medication in medication_sources.values():
            if len(medication["sources"]) > 1:
                alerts.append({
                    "id": f"{patient.id}-{medication['name']}", "patient": user.name,
                    "patient_id": str(patient.id), "risk": "Medium", "type": "Medication Review",
                    "detail": f"{medication['name']} appears in records from multiple providers",
                })
    return alerts[:50]

@router.get("/access")
def get_access_history(staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    from app.models import Appointment, AccessEvent, Patient
    events = db.query(AccessEvent).order_by(AccessEvent.created_at.desc()).limit(50).all()
    
    res = []
    for e in events:
        p = db.query(Patient).filter(Patient.id == e.patient_id).first()
        res.append({
            "id": str(e.id),
            "date": str(e.created_at.strftime("%Y-%m-%d %H:%M:%S")),
            "patient": p.user.name if p else "Unknown",
            "purpose": e.purpose,
            "scope": e.scope,
            "ip": e.ip
        })
    return res

@router.get("/integration/stats")
def get_integration_stats(db: Session = Depends(get_db)):
    return {
        "organizations_connected": 9,
        "records_unified": 8192,
        "patients_matched_multiple": 18,
        "duplicates_prevented": 305,
        "mapping_coverage": 98.4
    }

@router.get("/integration/nodes")
def get_integration_nodes():
    return [
        {"id": "n1", "name": "Kaveri Multispeciality", "city": "Chennai", "type": "hospital", "format": "FHIR R4", "status": "online", "records": 4120, "last_sync": "2 mins ago"},
        {"id": "n2", "name": "Metro Diagnostics", "city": "Bangalore", "type": "lab", "format": "CSV Batch", "status": "online", "records": 12850, "last_sync": "10 mins ago"},
        {"id": "n3", "name": "Sunrise Heart Institute", "city": "Hyderabad", "type": "hospital", "format": "HL7 v2", "status": "online", "records": 850, "last_sync": "1 hour ago"},
        {"id": "n4", "name": "Sanjeevani Clinic", "city": "Rural Karnataka", "type": "clinic", "format": "PDF/OCR", "status": "attention", "records": 320, "last_sync": "3 days ago", "error": "OCR Parsing Failed (12 records)"},
        {"id": "n5", "name": "CareFirst Pharmacy", "city": "Chennai", "type": "pharmacy", "format": "API Push", "status": "online", "records": 8900, "last_sync": "Just now"},
        {"id": "n6", "name": "Bharat Emergency", "city": "Mumbai", "type": "hospital", "format": "HL7 v2", "status": "online", "records": 210, "last_sync": "45 mins ago"},
        {"id": "n7", "name": "Apex Imaging", "city": "Bangalore", "type": "imaging", "format": "API Push", "status": "online", "records": 1450, "last_sync": "2 hours ago"},
        {"id": "n8", "name": "LifeCare Labs", "city": "Hyderabad", "type": "lab", "format": "CSV Batch", "status": "online", "records": 5600, "last_sync": "30 mins ago"},
        {"id": "n9", "name": "City General", "city": "Chennai", "type": "hospital", "format": "FHIR R4", "status": "online", "records": 3400, "last_sync": "5 mins ago"}
    ]

@router.get("/integration/queue/identity")
def get_identity_queue():
    # 6 mock review cases of varying difficulty
    return [
        {
            "id": "q1", 
            "score": 0.85, 
            "reason": "Name variant, different phone",
            "source": {"name": "Priya S.", "dob": "1979-08-14", "phone": "+91 99999 11111", "sex": "Female", "city": "Chennai", "abha": "91-1234-5678-9012", "org": "Metro Diagnostics"},
            "target": {"name": "Priya Sharma", "dob": "1979-08-14", "phone": "+91 98765 43210", "sex": "Female", "city": "Chennai", "abha": "91-1234-5678-9012", "org": "MedTrail Core"}
        },
        {
            "id": "q2", 
            "score": 0.88, 
            "reason": "Twins collision risk",
            "source": {"name": "Aarav Patel", "dob": "2015-11-20", "phone": "+91 98888 22222", "sex": "Male", "city": "Ahmedabad", "abha": "-", "org": "Sunrise Heart"},
            "target": {"name": "Vihaan Patel", "dob": "2015-11-20", "phone": "+91 98888 22222", "sex": "Male", "city": "Ahmedabad", "abha": "-", "org": "MedTrail Core"}
        },
        {
            "id": "q3", 
            "score": 0.76, 
            "reason": "Rounded DOB from rural clinic",
            "source": {"name": "Lakshmi N.", "dob": "1960-01-01", "phone": "+91 97777 33333", "sex": "Female", "city": "Rural Karnataka", "abha": "-", "org": "Sanjeevani Clinic"},
            "target": {"name": "Lakshmi Narayan", "dob": "1960-05-12", "phone": "+91 97777 33333", "sex": "Female", "city": "Bangalore", "abha": "91-5555-4444-3333", "org": "MedTrail Core"}
        },
        {
            "id": "q4", 
            "score": 0.92, 
            "reason": "Transliteration variant",
            "source": {"name": "Mohd. Tariq", "dob": "1985-03-25", "phone": "+91 96666 44444", "sex": "Male", "city": "Hyderabad", "abha": "91-7777-8888-9999", "org": "LifeCare Labs"},
            "target": {"name": "Muhammad Tariq", "dob": "1985-03-25", "phone": "+91 96666 44444", "sex": "Male", "city": "Hyderabad", "abha": "91-7777-8888-9999", "org": "MedTrail Core"}
        },
        {
            "id": "q5", 
            "score": 0.45, 
            "reason": "Obvious different person",
            "source": {"name": "Ramesh Iyer", "dob": "1955-10-10", "phone": "+91 95555 55555", "sex": "Male", "city": "Chennai", "abha": "-", "org": "City General"},
            "target": {"name": "Ramesh Singh", "dob": "1990-02-15", "phone": "+91 94444 66666", "sex": "Male", "city": "Mumbai", "abha": "-", "org": "MedTrail Core"}
        },
        {
            "id": "q6", 
            "score": 0.65, 
            "reason": "Same name, differing DOB and Phone",
            "source": {"name": "Kiran Kumar", "dob": "1988-07-22", "phone": "+91 93333 77777", "sex": "Male", "city": "Bangalore", "abha": "-", "org": "Apex Imaging"},
            "target": {"name": "Kiran Kumar", "dob": "1972-11-05", "phone": "+91 92222 88888", "sex": "Male", "city": "Chennai", "abha": "-", "org": "MedTrail Core"}
        }
    ]


@router.get("/er/board")
def get_er_board(staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    import random
    from datetime import datetime, timedelta
    
    # We will pick 15 patients to populate the board across 5 lanes
    patients = db.query(Patient).limit(20).all()
    
    # Priority 1: Immediate, 2: Emergent, 3: Urgent, 4: Non-urgent, 5: Awaiting registration
    board = {
        "p1": [],
        "p2": [],
        "p3": [],
        "p4": [],
        "p5": [] # Awaiting registration
    }
    
    complaints = {
        1: [("Cardiac Arrest", {"BP": "60/40", "HR": "140", "SpO2": "85%", "Temp": "36.2C"}), ("Major Trauma", {"BP": "70/40", "HR": "130", "SpO2": "88%", "Temp": "36.5C"})],
        2: [("Chest Pain", {"BP": "160/100", "HR": "110", "SpO2": "94%", "Temp": "37.1C"}), ("Severe Asthma", {"BP": "130/80", "HR": "120", "SpO2": "89%", "Temp": "37.3C"}), ("Stroke Symptoms", {"BP": "180/110", "HR": "90", "SpO2": "96%", "Temp": "37.0C"})],
        3: [("Abdominal Pain", {"BP": "120/80", "HR": "95", "SpO2": "98%", "Temp": "38.2C"}), ("Fracture", {"BP": "130/85", "HR": "100", "SpO2": "99%", "Temp": "37.1C"}), ("Laceration", {"BP": "110/70", "HR": "85", "SpO2": "99%", "Temp": "37.0C"})],
        4: [("Mild Fever", {"BP": "115/75", "HR": "80", "SpO2": "99%", "Temp": "38.5C"}), ("Sprain", {"BP": "120/80", "HR": "75", "SpO2": "100%", "Temp": "37.0C"})],
        5: [("Unknown illness", {"BP": "---", "HR": "---", "SpO2": "---", "Temp": "---"})]
    }
    
    for i, p in enumerate(patients[:16]):
        if i < 2: prio = 1
        elif i < 6: prio = 2
        elif i < 11: prio = 3
        elif i < 14: prio = 4
        else: prio = 5
        
        c_list = complaints[prio]
        c = c_list[i % len(c_list)]
        
        arrival = datetime.now() - timedelta(minutes=random.randint(5, 120))
        
        card = {
            "id": str(p.id),
            "name": p.user.name if p.user else "Unknown Patient",
            "age": random.randint(20, 75),
            "sex": p.sex if p.sex else "U",
            "arrival_time": arrival.strftime("%H:%M"),
            "wait_minutes": int((datetime.now() - arrival).total_seconds() / 60),
            "complaint": c[0],
            "vitals": c[1],
            "allergy": "Penicillin" if random.random() > 0.7 else None,
            "history_orgs": random.randint(1, 4) if prio != 5 else 0,
            "assigned_to": "Dr. Rao" if prio < 4 else None,
            "timer": "ECG due in 5m" if c[0] == "Chest Pain" else None,
            "abha": p.abha_number
        }
        
        if prio == 5:
            # Overwrite name for awaiting registration
            card["name"] = "Unidentified Male" if random.random() > 0.5 else "Unidentified Female"
        
        board[f"p{prio}"].append(card)

    return board
