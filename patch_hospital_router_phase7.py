with open("api/app/routers/hospital_router.py", "r") as f:
    content = f.read()

new_endpoints = """
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
"""

if "class NotePayload" not in content:
    content += new_endpoints
    with open("api/app/routers/hospital_router.py", "w") as f:
        f.write(content)

# Now patch the inbox mock to include corrections
with open("api/app/routers/hospital_router.py", "r") as f:
    content = f.read()

inbox_mock_addition = """
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
"""
if '"corrections": [' not in content:
    content = content.replace('"orders": [', inbox_mock_addition + ',\n        "orders": [')
    with open("api/app/routers/hospital_router.py", "w") as f:
        f.write(content)
