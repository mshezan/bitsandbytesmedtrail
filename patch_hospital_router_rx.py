with open("api/app/routers/hospital_router.py", "r") as f:
    content = f.read()

new_endpoint = """
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
"""

if "class RxPayload" not in content:
    content += new_endpoint
    with open("api/app/routers/hospital_router.py", "w") as f:
        f.write(content)
