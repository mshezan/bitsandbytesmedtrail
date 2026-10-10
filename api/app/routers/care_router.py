from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta, timezone
import uuid

from app.deps import SessionDep, CurrentUser, CurrentPatient
from app.models import Record, Share, User, Patient, MedicationInteraction, AllergyDrugMap, Staff, Consent, AccessEvent, PatientRecordNote
from pydantic import BaseModel, Field

router = APIRouter(tags=["care"])

def medication_name(record: Record) -> str:
    value = record.fhir.get("medicationCodeableConcept", {}).get("text")
    if not value:
        medication = record.fhir.get("medication", "Unknown")
        value = medication.get("text", "Unknown") if isinstance(medication, dict) else medication
    return str(value or "Unknown")

def clinician_grant(user: User, db: Session, patient_id: uuid.UUID):
    if user.role not in ["hospital_staff", "org_admin"]:
        raise HTTPException(status_code=403, detail="Clinician access required")
    staff = db.query(Staff).filter(Staff.user_id == user.id).first()
    if not staff:
        raise HTTPException(status_code=403, detail="Staff record not found")
    consent = db.query(Consent).filter(
        Consent.patient_id == patient_id, Consent.org_id == staff.org_id,
        Consent.status == "active", Consent.expires_at > datetime.now(timezone.utc)
    ).order_by(Consent.expires_at.desc()).first()
    if not consent:
        raise HTTPException(status_code=403, detail="Active patient consent is required")
    return staff, consent

@router.get("/overview")
def get_overview(patient: CurrentPatient, db: SessionDep):
    # counts, needs-attention items, sources, recent additions
    verified_records = (Record.patient_id == patient.id, Record.verified.is_(True), Record.status != "entered_in_error")
    records_count = db.query(Record).filter(*verified_records).count()
    sources = db.query(Record.source_name).filter(*verified_records).distinct().all()
    sources_count = len(sources)
    
    recent = db.query(Record).filter(*verified_records).order_by(Record.recorded_date.desc()).limit(5).all()
    recent_additions = [{"id": r.id, "type": r.type, "source": r.source_name, "date": r.recorded_date} for r in recent]
    
    needs_attention = db.query(Record).filter(
        Record.patient_id == patient.id,
        Record.source_type == "upload",
        Record.verified.is_(False),
        Record.patient_confirmed.is_(False),
        Record.status != "entered_in_error"
    ).all()
    attention_items = [{"id": r.id, "type": r.type, "source": r.source_name} for r in needs_attention]
    
    return {
        "counts": {"records": records_count, "sources": sources_count},
        "needs_attention": attention_items,
        "sources": [s[0] for s in sources],
        "recent_additions": recent_additions
    }

@router.get("/medications/reconciled")
def get_reconciled_medications(patient: CurrentPatient, db: SessionDep):
    # merged list with conflict flags
    meds = db.query(Record).filter(Record.patient_id == patient.id, Record.type == "medication", Record.verified.is_(True), Record.status != "entered_in_error").all()
    allergies = db.query(Record).filter(Record.patient_id == patient.id, Record.type == "allergy", Record.verified.is_(True), Record.status != "entered_in_error").all()
    notes = db.query(PatientRecordNote).filter(PatientRecordNote.patient_id == patient.id,
        PatientRecordNote.record_id.in_([r.id for r in meds])).order_by(PatientRecordNote.created_at.desc()).all() if meds else []
    patient_resolution = {}
    for note in notes:
        if note.record_id not in patient_resolution and note.note.startswith("Medication reconciliation: "):
            patient_resolution[note.record_id] = note.note.split(": ", 1)[1]
    
    merged = {}
    for m in meds:
        name = medication_name(m).lower()
        if name not in merged:
            merged[name] = {"doses": [], "sources": [], "prescribers": [], "records": []}
        
        dosage_list = m.fhir.get("dosage") or m.fhir.get("dosageInstruction") or [{"text": "Unknown"}]
        dose_text = dosage_list[0].get("text", "Unknown") if dosage_list else "Unknown"
        merged[name]["doses"].append(dose_text)
        
        merged[name]["sources"].append(m.source_name)
        merged[name]["prescribers"].append(m.fhir.get("prescriber", "Unknown"))
        merged[name]["records"].append(m)

    reconciled = []
    for name, data in merged.items():
        flags = []
        unresolved = [r for r in data["records"] if patient_resolution.get(r.id) not in {"keep", "discontinued"}]
        unique_doses = list(set(data["doses"]))
        unique_prescribers = list(set([p for p in data["prescribers"] if p != "Unknown"]))
        
        if len(unique_doses) > 1 and len(unresolved) > 1:
            flags.append("same drug different dose across prescribers")
            
        # check allergy
        if unresolved:
            for a in allergies:
                allergen_code = a.fhir.get("code", {}).get("text", a.fhir.get("allergy", "")).lower()
                if allergen_code and allergen_code in name:
                    flags.append(f"allergy conflict with {allergen_code}")
                    break
                
        # basic therapeutic duplication
        if len(unresolved) > 1 and len(unique_prescribers) > 1:
            flags.append("therapeutic duplication")
            
        reconciled.append({
            "medication": name,
            "doses": unique_doses,
            "records": [{"id": str(r.id), "dose": (r.fhir.get("dosage") or r.fhir.get("dosageInstruction") or [{"text": "Unknown"}])[0].get("text", "Unknown"), "source": r.source_name, "date": r.recorded_date, "resolution": patient_resolution.get(r.id)} for r in data["records"]],
            "sources": list(set(data["sources"])),
            "prescribers": unique_prescribers,
            "flags": flags
        })
        
    return {"reconciled": reconciled}

@router.get("/labs/by-test")
def get_labs_by_test(patient: CurrentPatient, db: SessionDep):
    labs = db.query(Record).filter(Record.patient_id == patient.id, Record.type == "observation", Record.verified.is_(True), Record.status != "entered_in_error").all()
    grouped = {}
    for l in labs:
        test_name = l.fhir.get("code", {}).get("text", l.fhir.get("observation", "Unknown"))
        if test_name not in grouped:
            grouped[test_name] = []
        grouped[test_name].append({
            "date": l.recorded_date,
            "value": l.fhir.get("valueQuantity", {}).get("value"),
            "unit": l.fhir.get("valueQuantity", {}).get("unit"),
            "source": l.source_name
        })
    return {"labs": grouped}

@router.get("/providers")
def get_providers(patient: CurrentPatient, db: SessionDep):
    # lists facilities with last visit and gaps
    records = db.query(Record).filter(Record.patient_id == patient.id, Record.verified.is_(True), Record.status != "entered_in_error").all()
    providers = {}
    for r in records:
        src = r.source_name
        if src not in providers:
            providers[src] = []
        providers[src].append(r.recorded_date)
        
    result = []
    for src, dates in providers.items():
        dates.sort()
        last_visit = dates[-1]
        gap_days = (date.today() - last_visit).days
        result.append({
            "facility": src,
            "last_visit": last_visit,
            "gap_days": gap_days
        })
    return {"providers": result}

class HandoverRequest(BaseModel):
    notes: Optional[str] = None
    record_types: list[str] = Field(default_factory=lambda: ["condition", "medication", "allergy"])

@router.post("/handover")
def create_handover(patient: CurrentPatient, db: SessionDep, req: HandoverRequest):
    # assemble packet, return preview and share link
    allowed = {"condition", "medication", "allergy", "observation", "encounter", "report"}
    if not req.record_types or not set(req.record_types).issubset(allowed):
        raise HTTPException(status_code=422, detail="Choose valid record categories")
    from app.routers.share_router import hash_token
    from app.config import settings
    token = __import__("secrets").token_urlsafe(32)
    share = Share(
        patient_id=patient.id,
        token_hash=hash_token(token),
        scope={"types": req.record_types, "notes": req.notes},
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    
    return {
        "preview": "Handover packet ready for sharing",
        "share_link": f"{settings.web_base_url.rstrip('/')}/shared/{token}"
    }

class ClinicianNoteReq(BaseModel):
    patient_id: uuid.UUID
    note: str
    type: str = "report"

@router.post("/clinician/notes")
def add_clinician_note(user: CurrentUser, db: SessionDep, req: ClinicianNoteReq):
    if req.type != "report" or not req.note.strip():
        raise HTTPException(status_code=422, detail="A non-empty clinical note is required")
    staff, consent = clinician_grant(user, db, req.patient_id)
    if "report" not in consent.scope.split(","):
        raise HTTPException(status_code=403, detail="Consent does not include clinical notes")
        
    record = Record(
        patient_id=req.patient_id,
        type=req.type,
        fhir={"note": req.note, "author": user.name},
        source_name=user.name,
        source_type="upload",
        recorded_date=date.today(),
        verified=False,
        source_org_id=staff.org_id,
        created_by_staff_id=staff.id
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"status": "success", "record_id": record.id}

@router.get("/clinician/checks/test")
def check_test(user: CurrentUser, db: SessionDep, name: str, patient_id: uuid.UUID):
    if not name.strip():
        raise HTTPException(status_code=422, detail="Test name is required")
    staff, consent = clinician_grant(user, db, patient_id)
    if "observation" not in consent.scope.split(","):
        raise HTTPException(status_code=403, detail="Consent does not include lab results")
    records = db.query(Record).filter(Record.patient_id == patient_id, Record.type == "observation", Record.verified.is_(True), Record.status != "entered_in_error").all()
    found = []
    for r in records:
        obs_name = r.fhir.get("code", {}).get("text", r.fhir.get("observation", "")).lower()
        if name.lower() in obs_name:
            found.append(r)
    db.add(AccessEvent(patient_id=patient_id, org_id=staff.org_id, staff_id=staff.id,
                       purpose="Prior test check", scope="observation", records_viewed=len(found)))
    db.commit()
    return {"test": name, "previously_done": len(found) > 0, "count": len(found)}

@router.get("/clinician/checks/drug")
def check_drug(user: CurrentUser, db: SessionDep, name: str, patient_id: uuid.UUID):
    staff, consent = clinician_grant(user, db, patient_id)
    allowed = set(consent.scope.split(","))
    if not allowed.intersection({"medication", "allergy"}):
        raise HTTPException(status_code=403, detail="Consent does not include medications or allergies")
    
    allergies = db.query(Record).filter(Record.patient_id == patient_id, Record.type == "allergy", Record.verified.is_(True), Record.status != "entered_in_error").all() if "allergy" in allowed else []
    conflict = False
    allergy_details = []
    allergy_maps = db.query(AllergyDrugMap).all()
    for a in allergies:
        allergen = str(a.fhir.get("code", {}).get("text", a.fhir.get("allergy", ""))).lower()
        for mapping in allergy_maps:
            if allergen and allergen == mapping.allergen.lower() and mapping.drug_or_class.lower() in name.lower():
                conflict = True
                allergy_details.append(f"Recorded {mapping.allergen} allergy may relate to {mapping.drug_or_class}.")
                break
            
    meds = db.query(Record).filter(Record.patient_id == patient_id, Record.type == "medication", Record.verified.is_(True), Record.status != "entered_in_error").all() if "medication" in allowed else []
    medication_match = False
    interaction_details = []
    interaction_rules = db.query(MedicationInteraction).all()
    current_names = [medication_name(m).casefold() for m in meds]
    for m in meds:
        if medication_name(m).casefold() == name.casefold():
            medication_match = True
    for rule in interaction_rules:
        drug_a, drug_b = rule.drug_a.casefold(), rule.drug_b.casefold()
        if (name.casefold() == drug_a and any(drug_b in med for med in current_names)) or (name.casefold() == drug_b and any(drug_a in med for med in current_names)):
            interaction_details.append({"severity": rule.severity, "description": rule.description})

    db.add(AccessEvent(patient_id=patient_id, org_id=staff.org_id, staff_id=staff.id,
                       purpose="Medication record check", scope=",".join(sorted(allowed)),
                       records_viewed=len(allergies) + len(meds)))
    db.commit()
            
    return {"drug": name, "allergy_conflict": conflict, "allergy_details": allergy_details,
            "current_medication_match": medication_match, "interaction_warning": bool(interaction_details),
            "interaction_details": interaction_details}


class ResolveReq(BaseModel):
    action: str  # 'keep', 'discontinued', 'ask_doctor'

@router.post("/medications/{id}/resolve")
def resolve_medication(id: uuid.UUID, req: ResolveReq, patient: CurrentPatient, db: SessionDep):
    if req.action not in {"keep", "discontinued", "ask_doctor"}:
        raise HTTPException(status_code=422, detail="Invalid resolution action")
    record = db.query(Record).filter(Record.id == id, Record.patient_id == patient.id).first()
    if not record:
        raise HTTPException(status_code=404)
    db.add(PatientRecordNote(patient_id=patient.id, record_id=record.id,
        note=f"Medication reconciliation: {req.action}"))
    from app.routers.share_router import log_audit
    log_audit(db, patient.id, "patient", "Self", f"Resolved med conflict: {req.action}")
    return {"status": "success"}

class ProviderRequestReq(BaseModel):
    provider_name: str

@router.post("/providers/request")
def request_records(req: ProviderRequestReq, patient: CurrentPatient, db: SessionDep):
    raise HTTPException(status_code=501, detail="Provider record requests are not connected. Use a secure share link to provide records to a provider.")
