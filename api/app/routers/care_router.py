from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
import uuid

from app.deps import SessionDep, CurrentUser, CurrentPatient
from app.models import Record, Share, User, Patient, MedicationInteraction, AllergyDrugMap
from pydantic import BaseModel

router = APIRouter(tags=["care"])

@router.get("/overview")
def get_overview(patient: CurrentPatient, db: SessionDep):
    # counts, needs-attention items, sources, recent additions
    records_count = db.query(Record).filter(Record.patient_id == patient.id).count()
    sources = db.query(Record.source_name).filter(Record.patient_id == patient.id).distinct().all()
    sources_count = len(sources)
    
    recent = db.query(Record).filter(Record.patient_id == patient.id).order_by(Record.recorded_date.desc()).limit(5).all()
    recent_additions = [{"id": r.id, "type": r.type, "source": r.source_name, "date": r.recorded_date} for r in recent]
    
    needs_attention = db.query(Record).filter(
        Record.patient_id == patient.id,
        Record.verified == False
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
    meds = db.query(Record).filter(Record.patient_id == patient.id, Record.type == "medication").all()
    allergies = db.query(Record).filter(Record.patient_id == patient.id, Record.type == "allergy").all()
    
    merged = {}
    for m in meds:
        name = m.fhir.get("medicationCodeableConcept", {}).get("text", m.fhir.get("medication", "Unknown")).lower()
        if name not in merged:
            merged[name] = {"doses": [], "sources": [], "prescribers": [], "records": []}
        
        dosage_list = m.fhir.get("dosage", [{"text": "Unknown"}])
        dose_text = dosage_list[0].get("text", "Unknown") if dosage_list else "Unknown"
        merged[name]["doses"].append(dose_text)
        
        merged[name]["sources"].append(m.source_name)
        merged[name]["prescribers"].append(m.fhir.get("prescriber", "Unknown"))
        merged[name]["records"].append(m)

    reconciled = []
    for name, data in merged.items():
        flags = []
        unique_doses = list(set(data["doses"]))
        unique_prescribers = list(set([p for p in data["prescribers"] if p != "Unknown"]))
        
        if len(unique_doses) > 1 and len(unique_prescribers) > 1:
            flags.append("same drug different dose across prescribers")
            
        # check allergy
        for a in allergies:
            allergen_code = a.fhir.get("code", {}).get("text", a.fhir.get("allergy", "")).lower()
            if allergen_code and allergen_code in name:
                flags.append(f"allergy conflict with {allergen_code}")
                
        # basic therapeutic duplication
        if len(data["records"]) > 1 and len(unique_prescribers) > 1:
            flags.append("therapeutic duplication")
            
        reconciled.append({
            "medication": name,
            "doses": unique_doses,
            "sources": list(set(data["sources"])),
            "prescribers": unique_prescribers,
            "flags": flags
        })
        
    return {"reconciled": reconciled}

@router.get("/labs/by-test")
def get_labs_by_test(patient: CurrentPatient, db: SessionDep):
    labs = db.query(Record).filter(Record.patient_id == patient.id, Record.type == "observation").all()
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
    records = db.query(Record).filter(Record.patient_id == patient.id).all()
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

@router.post("/handover")
def create_handover(patient: CurrentPatient, db: SessionDep, req: HandoverRequest):
    # assemble packet, return preview and share link
    share = Share(
        patient_id=patient.id,
        token_hash=uuid.uuid4().hex,
        scope={"type": "handover", "notes": req.notes},
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    
    return {
        "preview": "Handover packet ready for sharing",
        "share_link": f"/share/{share.token_hash}"
    }

class ClinicianNoteReq(BaseModel):
    patient_id: uuid.UUID
    note: str
    type: str = "report"

@router.post("/clinician/notes")
def add_clinician_note(user: CurrentUser, db: SessionDep, req: ClinicianNoteReq):
    if user.role != "clinician":
        raise HTTPException(status_code=403, detail="Only clinicians can add notes")
        
    record = Record(
        patient_id=req.patient_id,
        type=req.type,
        fhir={"note": req.note, "author": user.name},
        source_name=user.name,
        source_type="upload",
        recorded_date=date.today(),
        verified=False
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"status": "success", "record_id": record.id}

@router.get("/clinician/checks/test")
def check_test(user: CurrentUser, db: SessionDep, name: str, patient_id: uuid.UUID):
    if user.role != "clinician":
        raise HTTPException(status_code=403)
    records = db.query(Record).filter(Record.patient_id == patient_id, Record.type == "observation").all()
    found = []
    for r in records:
        obs_name = r.fhir.get("code", {}).get("text", r.fhir.get("observation", "")).lower()
        if name.lower() in obs_name:
            found.append(r)
    return {"test": name, "previously_done": len(found) > 0, "count": len(found)}

@router.get("/clinician/checks/drug")
def check_drug(user: CurrentUser, db: SessionDep, name: str, patient_id: uuid.UUID):
    if user.role != "clinician":
        raise HTTPException(status_code=403)
    
    allergies = db.query(Record).filter(Record.patient_id == patient_id, Record.type == "allergy").all()
    conflict = False
    for a in allergies:
        allergen = a.fhir.get("code", {}).get("text", a.fhir.get("allergy", "")).lower()
        if allergen and allergen in name.lower():
            conflict = True
            break
            
    meds = db.query(Record).filter(Record.patient_id == patient_id, Record.type == "medication").all()
    interaction = False
    for m in meds:
        med_name = m.fhir.get("medicationCodeableConcept", {}).get("text", m.fhir.get("medication", "")).lower()
        if med_name == name.lower():
            interaction = True
            break
            
    return {"drug": name, "allergy_conflict": conflict, "interaction_warning": interaction}


class ResolveReq(BaseModel):
    action: str  # 'keep', 'discontinued', 'ask_doctor'

@router.post("/medications/{id}/resolve")
def resolve_medication(id: uuid.UUID, req: ResolveReq, patient: CurrentPatient, db: SessionDep):
    record = db.query(Record).filter(Record.id == id, Record.patient_id == patient.id).first()
    if not record:
        raise HTTPException(status_code=404)
    record.fhir["conflict_resolution"] = req.action
    db.commit()
    # Log audit
    from app.routers.share_router import log_audit
    log_audit(db, patient.id, "patient", "Self", f"Resolved med conflict: {req.action}")
    return {"status": "success"}

class ProviderRequestReq(BaseModel):
    provider_name: str

@router.post("/providers/request")
def request_records(req: ProviderRequestReq, patient: CurrentPatient, db: SessionDep):
    from app.routers.share_router import log_audit
    log_audit(db, patient.id, "patient", "Self", f"Requested records from {req.provider_name}")
    return {"status": "requested"}
