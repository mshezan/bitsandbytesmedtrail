from fastapi import APIRouter
from typing import Optional
from app.deps import CurrentPatient, SessionDep
from app.models import Record

router = APIRouter(tags=["timeline"])

@router.get("/timeline")
def get_timeline(patient: CurrentPatient, db: SessionDep, type: Optional[str] = None):
    query = db.query(Record).filter(
        Record.patient_id == patient.id,
        Record.verified == True
    )
    if type:
        query = query.filter(Record.type == type)
        
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

@router.get("/trends/{observation_name}")
def get_trends(observation_name: str, patient: CurrentPatient, db: SessionDep):
    records = (
        db.query(Record)
        .filter(Record.patient_id == patient.id)
        .filter(Record.type == "observation")
        .filter(Record.verified == True)
        .order_by(Record.recorded_date.asc())
        .all()
    )
    
    trends = []
    for r in records:
        text = r.fhir.get("code", {}).get("text", "")
        if observation_name.lower() in text.lower():
            value_q = r.fhir.get("valueQuantity", {})
            value = value_q.get("value")
            unit = value_q.get("unit", "")
            if value is not None:
                trends.append({
                    "date": r.recorded_date,
                    "value": float(value),
                    "unit": unit
                })
    return trends
