from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.deps import CurrentPatient, SessionDep
from app.models import Record, MedicationAdherence
from datetime import datetime
import uuid

router = APIRouter(prefix="/records", tags=["records"])

@router.get("")
def list_records(
    patient: CurrentPatient,
    db: SessionDep,
    type: Optional[str] = None,
    source: Optional[str] = None,
    verified: Optional[bool] = None
):
    query = db.query(Record).filter(Record.patient_id == patient.id)
    if type:
        query = query.filter(Record.type == type)
    if source:
        query = query.filter(Record.source_type == source)
    if verified is not None:
        query = query.filter(Record.verified == verified)
        
    records = query.order_by(Record.recorded_date.desc()).all()
    
    return [
        {
            "id": r.id,
            "type": r.type,
            "fhir": r.fhir,
            "source_name": r.source_name,
            "recorded_date": r.recorded_date,
            "verified": r.verified,
            "patient_confirmed": r.patient_confirmed,
            "source_type": r.source_type,
            "status": r.status,
            "hidden_from_shares": r.hidden_from_shares,
        }
        for r in records
    ]

@router.get("/labs/summary")
def get_labs_summary(patient: CurrentPatient, db: SessionDep):
    # Group by observation name, get latest, compute trend
    labs = db.query(Record).filter(Record.patient_id == patient.id, Record.type == "observation", Record.verified.is_(True), Record.status != "entered_in_error").order_by(Record.recorded_date.desc()).all()
    
    grouped = {}
    for lab in labs:
        name = lab.fhir.get("observation", lab.fhir.get("code", {}).get("text", "Unknown"))
        if name not in grouped:
            grouped[name] = []
        grouped[name].append(lab)
        
    summary = []
    for name, lab_records in grouped.items():
        latest = lab_records[0]
        value = latest.fhir.get("valueQuantity", {}).get("value")
        unit = latest.fhir.get("valueQuantity", {}).get("unit")
        ref_range = latest.fhir.get("referenceRange", [{}])[0].get("text", "")
        
        status = "Not assessed"
        trend = "stable"
        if len(lab_records) > 1:
            prev_val = lab_records[1].fhir.get("valueQuantity", {}).get("value")
            if value and prev_val:
                try:
                    if float(value) > float(prev_val):
                        trend = "up"
                    elif float(value) < float(prev_val):
                        trend = "down"
                except:
                    pass
                    
        summary.append({
            "test_name": name,
            "latest_value": value,
            "unit": unit,
            "range": ref_range,
            "status": status,
            "trend": trend,
            "date": latest.recorded_date
        })
    return summary

from pydantic import BaseModel
class RecordUpdate(BaseModel):
    fhir: Optional[dict] = None
    model_config = {"extra": "forbid"}

@router.patch("/{id}")
def update_record(id: uuid.UUID, update_data: RecordUpdate, patient: CurrentPatient, db: SessionDep):
    record = db.query(Record).filter(Record.id == id, Record.patient_id == patient.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if record.source_type != "upload" or record.verified or record.patient_confirmed:
        raise HTTPException(status_code=403, detail="Only an unconfirmed patient upload can be edited. Provider records are locked.")
    if update_data.fhir is not None:
        record.fhir = update_data.fhir
    elif not update_data.model_fields_set:
        raise HTTPException(status_code=422, detail="Provide updated extracted fields")
    from app.models import AuditLog
    db.add(AuditLog(patient_id=patient.id, actor_type="patient", actor_label="Self",
                    action="Edited unconfirmed upload", detail=f"Record {record.id}"))
    db.commit()
    return {"message": "Record updated"}


@router.post("/{id}/confirm")
def confirm_upload(id: uuid.UUID, patient: CurrentPatient, db: SessionDep):
    record = db.query(Record).filter(Record.id == id, Record.patient_id == patient.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if record.source_type != "upload" or record.verified:
        raise HTTPException(status_code=403, detail="Only patient-uploaded records can be confirmed here")
    if record.patient_confirmed:
        return {"status": "already_confirmed", "verified": False}
    record.patient_confirmed = True
    from app.models import AuditLog
    db.add(AuditLog(patient_id=patient.id, actor_type="patient", actor_label="Self",
                    action="Confirmed patient upload", detail=f"Record {record.id}; remains unverified"))
    db.commit()
    return {"status": "patient_confirmed_unverified", "verified": False}

@router.delete("/{id}")
def delete_record(id: uuid.UUID, patient: CurrentPatient, db: SessionDep):
    record = db.query(Record).filter(Record.id == id, Record.patient_id == patient.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if record.source_type != "upload" or record.verified or record.patient_confirmed:
        raise HTTPException(status_code=403, detail="Only an unconfirmed patient upload can be discarded. Provider records are locked.")
    from app.models import AuditLog
    db.add(AuditLog(patient_id=patient.id, actor_type="patient", actor_label="Self",
                    action="Discarded unconfirmed upload", detail=f"Record {record.id}"))
    db.delete(record)
    db.commit()
    return {"message": "Record deleted"}

class AdherenceData(BaseModel):
    taken: bool
    scheduled_time: datetime

@router.post("/medications/{id}/adherence")
def log_adherence(id: uuid.UUID, data: AdherenceData, patient: CurrentPatient, db: SessionDep):
    if data.scheduled_time.tzinfo is None:
        raise HTTPException(status_code=422, detail="scheduled_time must include a timezone")
    med = db.query(Record).filter(Record.id == id, Record.patient_id == patient.id, Record.type == "medication").first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
        
    adherence = MedicationAdherence(
        id=uuid.uuid4(),
        patient_id=patient.id,
        medication_id=med.id,
        scheduled_time=data.scheduled_time,
        taken=data.taken
    )
    db.add(adherence)
    db.commit()
    return {"message": "Adherence logged"}
