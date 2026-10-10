from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timezone, date
import uuid
from app.deps import get_db, CurrentUser
from app.models import Patient, User, Record, AccessEvent, Staff, Consent

router = APIRouter(prefix="/hospital", tags=["hospital"])

def get_current_staff(user: CurrentUser, db: Session = Depends(get_db)):
    if user.role not in ["hospital_staff", "org_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    staff = db.query(Staff).filter(Staff.user_id == user.id).first()
    if not staff:
        raise HTTPException(status_code=403, detail="Staff record not found")
    return staff

def active_consent(db: Session, patient_id, org_id):
    return db.query(Consent).filter(
        Consent.patient_id == patient_id, Consent.org_id == org_id,
        Consent.status == "active", Consent.expires_at > datetime.now(timezone.utc)
    ).order_by(Consent.expires_at.desc()).first()

def clinical_label(value, fallback="Unknown"):
    if isinstance(value, dict):
        return value.get("text") or value.get("display") or fallback
    return value if isinstance(value, str) and value else fallback

@router.get("/search")
def search_patients(q: str = Query(""), staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    if not q:
        return []
    
    granted = db.query(Consent.patient_id).filter(
        Consent.org_id == staff.org_id, Consent.status == "active",
        Consent.expires_at > datetime.now(timezone.utc)
    )
    patients = db.query(Patient).join(User).filter(Patient.id.in_(granted),
        or_(
            User.name.ilike(f"%{q}%"),
            User.phone.ilike(f"%{q}%"),
            Patient.abha_number.ilike(f"%{q}%")
        )
    ).limit(20).all()

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
    if not active_consent(db, patient.id, staff.org_id):
        raise HTTPException(403, "Active patient consent is required")
    evt = AccessEvent(
        id=uuid.uuid4(),
        patient_id=patient_id,
        org_id=staff.org_id,
        staff_id=staff.id,
        purpose=purpose,
        scope="summary"
    )
    db.add(evt)
    db.commit()
    return {"status": "logged", "access_id": evt.id}

@router.get("/patient/{patient_id}")
def get_patient_summary(patient_id: uuid.UUID, staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
        
    consent = active_consent(db, p.id, staff.org_id)
    if not consent:
        raise HTTPException(403, "Active patient consent is required")
    allowed_types = [part.strip() for part in consent.scope.split(",") if part.strip()]
    records = db.query(Record).filter(Record.patient_id == patient_id, Record.type.in_(allowed_types), Record.verified.is_(True), Record.status != "entered_in_error").all()
    db.add(AccessEvent(patient_id=p.id, org_id=staff.org_id, staff_id=staff.id,
                       purpose="Clinical record viewed", scope=consent.scope,
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
    consent = active_consent(db, patient_id, staff.org_id)
    if not consent:
        raise HTTPException(403, "Active patient consent is required")
    record = db.query(Record).filter(Record.id == record_id, Record.patient_id == patient_id,
        Record.source_type == "upload", Record.patient_confirmed.is_(True),
        Record.verified.is_(False)).first()
    if not record:
        raise HTTPException(404, "Confirmed patient upload not found")
    if record.type not in consent.scope.split(","):
        raise HTTPException(403, "Consent does not include this record category")
    from app.models import AuditLog
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
    import datetime
    import random
    
    # Fetch some patients to use in the mock schedule
    patients = db.query(Patient).limit(5).all()
    schedule = []
    statuses = ["Done", "In consult", "Waiting", "Arrived", "Booked"]
    times = ["09:00 AM", "10:30 AM", "11:15 AM", "01:00 PM", "02:30 PM"]
    
    for i, p in enumerate(patients):
        u = p.user
        schedule.append({
            "id": p.id,
            "time": times[i % len(times)],
            "patient_name": u.name if u else "Unknown",
            "age": 45 + i,
            "sex": u.sex if u else "U",
            "reason": "Follow-up" if i % 2 == 0 else "New Consult",
            "status": statuses[i % len(statuses)],
            "flags": ["high-risk"] if i == 1 else (["allergy"] if i == 2 else [])
        })
        
    return {
        "doctor_name": staff.user.name if staff.user else "Doctor",
        "clinic": staff.organization.name if staff.organization else "Hospital",
        "stats": {
            "patients_today": 12,
            "waiting_now": 2,
            "results_review": 4,
            "open_alerts": 1
        },
        "schedule": schedule,
        "needs_attention": [
            {"id": 1, "type": "lab_critical", "title": "Critical HbA1c: 9.2%", "patient": "Priya Sharma", "time": "10 mins ago"},
            {"id": 2, "type": "interaction", "title": "Drug Interaction Warning", "patient": "Ramesh Iyer", "time": "1 hour ago"}
        ],
        "activity_feed": [
            {"id": 1, "text": "Discharge summary added from Sunrise Heart Institute", "patient": "Kavita Nair", "time": "2 hours ago"}
        ]
    }

@router.get("/patient/{patient_id}/workspace")
def get_consult_workspace(patient_id: uuid.UUID, staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
        
    records = db.query(Record).filter(Record.patient_id == patient_id, Record.status != "entered_in_error").all()
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
            conditions.append({"name": name, "onset": r.fhir.get("onsetDateTime") or str(r.recorded_date.date())})
            
    # Meds
    meds = []
    for r in records:
        if r.type == "medication":
            name = clinical_label(r.fhir.get("medicationCodeableConcept")) if r.fhir.get("medicationCodeableConcept") else clinical_label(r.fhir.get("medication"))
            meds.append({"name": name, "dose": "Unknown", "prescriber": r.source_name, "start": str(r.recorded_date.date())})
            
    # Key Labs
    labs = []
    for r in records:
        if r.type == "observation" and "BP" not in str(r.fhir):
            name = clinical_label(r.fhir.get("code"), "Observation")
            val = (r.fhir.get("valueQuantity") or {}).get("value") if isinstance(r.fhir.get("valueQuantity"), dict) else r.fhir.get("valueQuantity")
            labs.append({"name": name, "value": val, "date": str(r.recorded_date.date()), "trend": "up" if random.random() > 0.5 else "down"})
            
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
        "vitals": [
            {"name": "BP", "value": "120/80", "date": "Today"},
            {"name": "SpO2", "value": "98%", "date": "Today"}
        ]
    }

@router.get("/patient/{patient_id}/brief")
def get_or_generate_brief(patient_id: uuid.UUID, force_regenerate: bool = False, staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    from app.models import PreVisitBrief
    from app.llm_brief import generate_patient_brief
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
        
    if not force_regenerate:
        cached = db.query(PreVisitBrief).filter(PreVisitBrief.patient_id == patient_id, PreVisitBrief.org_id == staff.org_id).order_by(PreVisitBrief.created_at.desc()).first()
        if cached:
            return cached.content_json
            
    records = db.query(Record).filter(Record.patient_id == patient_id, Record.status != "entered_in_error").order_by(Record.recorded_date.desc()).all()
    brief_data = generate_patient_brief(records, patient, staff.org_id)
    
    new_brief = PreVisitBrief(patient_id=patient_id, org_id=staff.org_id, content_json=brief_data)
    db.add(new_brief)
    db.commit()
    
    return brief_data

from pydantic import BaseModel
from typing import List, Optional

class RxItem(BaseModel):
    drug: str
    dose: str
    route: str
    frequency: str
    timing: str
    duration: str
    instructions: Optional[str] = None
    problem: Optional[str] = None

class RxPayload(BaseModel):
    items: List[RxItem]

@router.post("/patient/{patient_id}/prescription")
def save_prescription(patient_id: uuid.UUID, payload: RxPayload, staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    from app.models import Record, AccessEvent
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
        
    org = db.query(Organization).filter(Organization.id == staff.org_id).first()
    
    records = []
    for item in payload.items:
        fhir_payload = {
            "resourceType": "MedicationRequest",
            "status": "active",
            "intent": "order",
            "medicationCodeableConcept": {"text": item.drug},
            "dosageInstruction": [
                {
                    "text": f"{item.dose} {item.route} {item.frequency} {item.timing} for {item.duration}. {item.instructions or ''}",
                    "timing": {"code": item.frequency}
                }
            ],
            "reasonCode": [{"text": item.problem}] if item.problem else []
        }
        
        r = Record(
            id=uuid.uuid4(),
            patient_id=patient_id,
            source_org_id=staff.org_id,
            source_name=org.name if org else "Hospital",
            type="medication",
            fhir=fhir_payload,
            recorded_date=datetime.now(timezone.utc),
            verified=True,
            verified_by_staff_id=staff.id,
            status="active"
        )
        db.add(r)
        records.append(str(r.id))
        
    db.add(AccessEvent(
        patient_id=patient_id,
        org_id=staff.org_id,
        staff_id=staff.id,
        purpose="Created prescription",
        scope="medication",
        records_viewed=0
    ))
    
    db.commit()
    
    return {
        "status": "success",
        "rx_id": f"RX-{uuid.uuid4().hex[:8].upper()}",
        "records_created": records,
        "message": f"Prescription with {len(payload.items)} items signed and locked."
    }

class OrderItem(BaseModel):
    test_name: str
    priority: str
    reason: str
    fasting: bool
    override_reason: Optional[str] = None

class OrderPayload(BaseModel):
    items: List[OrderItem]

@router.post("/patient/{patient_id}/order")
def place_order(patient_id: uuid.UUID, payload: OrderPayload, staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    from app.models import Record, AccessEvent
    org = db.query(Organization).filter(Organization.id == staff.org_id).first()
    
    records = []
    for item in payload.items:
        fhir_payload = {
            "resourceType": "ServiceRequest",
            "status": "active",
            "intent": "order",
            "priority": item.priority,
            "code": {"text": item.test_name},
            "reasonCode": [{"text": item.reason}],
            "note": [{"text": f"Fasting: {item.fasting}. Override Reason: {item.override_reason or 'N/A'}"}]
        }
        
        r = Record(
            id=uuid.uuid4(),
            patient_id=patient_id,
            source_org_id=staff.org_id,
            source_name=org.name if org else "Hospital",
            type="observation", # using observation to map broadly or a new type 'procedure'
            fhir=fhir_payload,
            recorded_date=datetime.now(timezone.utc),
            verified=True,
            verified_by_staff_id=staff.id,
            status="active"
        )
        db.add(r)
        records.append(str(r.id))
        
    db.commit()
    return {"status": "success", "order_id": f"ORD-{uuid.uuid4().hex[:8].upper()}"}

@router.get("/inbox")
def get_inbox(staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    # Mocked complex inbox payload for the prototype
    return {
        "results": [
            {
                "id": str(uuid.uuid4()),
                "patient_name": "Priya Sharma",
                "patient_id": "f135b91a-1286-455b-bb68-ec7b4f53ec38", # Will just be used for display
                "test": "HbA1c",
                "value": "9.2%",
                "flag": "critical",
                "previous_value": "8.4%",
                "trend": "up",
                "date": "Today",
                "acknowledged": False
            },
            {
                "id": str(uuid.uuid4()),
                "patient_name": "Ramesh Iyer",
                "patient_id": "f135b91a-1286-455b-bb68-ec7b4f53ec38",
                "test": "Creatinine",
                "value": "1.8 mg/dL",
                "flag": "abnormal",
                "previous_value": "1.4 mg/dL",
                "trend": "up",
                "date": "Yesterday",
                "acknowledged": False
            }
        ],
        
        "corrections": [
            {
                "id": str(uuid.uuid4()),
                "patient_name": "Priya Sharma",
                "patient_id": "f135b91a-1286-455b-bb68-ec7b4f53ec38",
                "disputed_field": "Medication: Metformin 1000mg",
                "patient_comment": "I stopped taking this 6 months ago on Dr. Rao's advice. Please remove.",
                "status": "pending",
                "date": "Today"
            }
        ]
,
        "orders": [
            {
                "id": "ORD-1A2B3C",
                "patient_name": "Fatima Khan",
                "test": "Chest X-Ray",
                "status": "pending",
                "priority": "urgent",
                "date": "Today"
            },
            {
                "id": "ORD-9X8Y7Z",
                "patient_name": "Arjun Reddy",
                "test": "Lipid Profile",
                "status": "completed",
                "priority": "routine",
                "date": "Yesterday"
            }
        ]
    }

@router.post("/inbox/{result_id}/acknowledge")
def acknowledge_result(result_id: str, staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    # In a real system, mark the record/observation as acknowledged by this staff_id
    return {"status": "acknowledged"}

class NotePayload(BaseModel):
    title: str
    content: str
    template: str

@router.post("/patient/{patient_id}/note")
def save_clinical_note(patient_id: uuid.UUID, payload: NotePayload, staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    from app.models import Record, AccessEvent
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
