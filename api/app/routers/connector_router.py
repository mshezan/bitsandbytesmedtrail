from fastapi import APIRouter, HTTPException
from app.deps import CurrentPatient, SessionDep
from app.connectors import CONNECTORS
from app.models import Record

router = APIRouter(prefix="/connectors", tags=["connectors"])

@router.get("")
def list_connectors():
    return [{"id": k, "name": k.replace("-", " ").title()} for k in CONNECTORS.keys()]

@router.post("/{name}/sync")
def sync_connector(name: str, patient: CurrentPatient, db: SessionDep):
    if name not in CONNECTORS:
        raise HTTPException(status_code=404, detail="Connector not found")
        
    connector = CONNECTORS[name]
    
    # In a real app, we might use an external patient identifier
    patient_ref = str(patient.id)
    raw_records = connector.fetch(patient_ref)
    
    imported_count = 0
    for raw in raw_records:
        fhir_data = connector.normalize(raw)
        
        source_name = name.replace("-", " ").title()
        duplicate = db.query(Record.id).filter(
            Record.patient_id == patient.id, Record.type == raw.type,
            Record.source_name == source_name, Record.recorded_date == raw.recorded_date,
            Record.fhir == fhir_data
        ).first()
        if duplicate:
            continue
        new_record = Record(
            patient_id=patient.id,
            type=raw.type,
            fhir=fhir_data,
            source_name=source_name,
            source_type="connector",
            recorded_date=raw.recorded_date,
            verified=True,  # Usually from clinic they might be auto-verified
            confidence=1.0
        )
        db.add(new_record)
        imported_count += 1
        
    db.commit()
    
    return {"message": "Sync successful", "imported_count": imported_count}
