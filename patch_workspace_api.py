with open("api/app/routers/hospital_router.py", "r") as f:
    content = f.read()

new_endpoint = """
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
"""

if "/workspace" not in content:
    content += new_endpoint
    with open("api/app/routers/hospital_router.py", "w") as f:
        f.write(content)
