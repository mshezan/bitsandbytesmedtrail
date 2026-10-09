from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.deps import CurrentPatient, SessionDep
from app.models import Record, MedicationAdherence
from datetime import datetime

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
        }
        for r in records
    ]

@router.get("/labs/summary")
def get_labs_summary(patient: CurrentPatient, db: SessionDep):
    # Group by observation name, get latest, compute trend
    labs = db.query(Record).filter(Record.patient_id == patient.id, Record.type == "observation").order_by(Record.recorded_date.desc()).all()
    
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
        
        status = "Normal"
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
    verified: Optional[bool] = None
    fhir: Optional[dict] = None

@router.patch("/{id}")
def update_record(id: str, update_data: RecordUpdate, patient: CurrentPatient, db: SessionDep):
    record = db.query(Record).filter(Record.id == id, Record.patient_id == patient.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    if update_data.verified is not None:
        record.verified = update_data.verified
    if update_data.fhir is not None:
        record.fhir = update_data.fhir
        
    db.commit()
    return {"message": "Record updated"}

@router.delete("/{id}")
def delete_record(id: str, patient: CurrentPatient, db: SessionDep):
    record = db.query(Record).filter(Record.id == id, Record.patient_id == patient.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    db.delete(record)
    db.commit()
    return {"message": "Record deleted"}

class AdherenceData(BaseModel):
    taken: bool
    scheduled_time: str

@router.post("/medications/{id}/adherence")
def log_adherence(id: str, data: AdherenceData, patient: CurrentPatient, db: SessionDep):
    import uuid
    med = db.query(Record).filter(Record.id == id, Record.patient_id == patient.id, Record.type == "medication").first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
        
    adherence = MedicationAdherence(
        id=uuid.uuid4(),
        patient_id=patient.id,
        medication_id=med.id,
        scheduled_time=datetime.fromisoformat(data.scheduled_time.replace('Z', '+00:00')),
        taken=data.taken
    )
    db.add(adherence)
    db.commit()
    return {"message": "Adherence logged"}
