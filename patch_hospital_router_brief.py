with open("api/app/routers/hospital_router.py", "r") as f:
    content = f.read()

new_endpoint = """
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
"""

if "/brief" not in content:
    content += new_endpoint
    with open("api/app/routers/hospital_router.py", "w") as f:
        f.write(content)
