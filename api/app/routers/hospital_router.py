from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.deps import get_db, CurrentUser
from app.models import Patient, User, Record, AccessEvent, Staff

router = APIRouter(prefix="/hospital", tags=["hospital"])

def get_current_staff(user: CurrentUser, db: Session = Depends(get_db)):
    if user.role not in ["hospital_staff", "org_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    staff = db.query(Staff).filter(Staff.user_id == user.id).first()
    if not staff:
        raise HTTPException(status_code=403, detail="Staff record not found")
    return staff

@router.get("/search")
def search_patients(q: str = Query(""), staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    if not q:
        return []
    
    patients = db.query(Patient).join(User).filter(
        or_(
            User.name.ilike(f"%{q}%"),
            User.phone.ilike(f"%{q}%"),
            Patient.abha_number.ilike(f"%{q}%")
        )
    ).limit(20).all()

    res = []
    for p in patients:
        res.append({
            "id": p.id,
            "name": p.user.name if p.user else "Unknown",
            "abha": p.abha_number,
            "phone": p.user.phone if p.user else None,
            "city": p.city,
            "sex": p.user.sex if p.user else "U",
            "dob": p.user.dob if p.user else None
        })
    return res

@router.post("/patient/{patient_id}/access")
def log_access(patient_id: str, purpose: str = Query(...), staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    import uuid
    evt = AccessEvent(
        id=uuid.uuid4(),
        patient_id=patient_id,
        org_id=staff.org_id,
        staff_id=staff.id,
        purpose=purpose,
        scope="summary"
    )
    db.add(evt)
    db.commit()
    return {"status": "logged", "access_id": evt.id}

@router.get("/patient/{patient_id}")
def get_patient_summary(patient_id: str, staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(404, "Patient not found")
        
    records = db.query(Record).filter(Record.patient_id == patient_id).all()
    
    return {
        "id": p.id,
        "name": p.user.name,
        "abha": p.abha_number,
        "age": 45, # mock computed
        "blood_group": p.blood_group,
        "allergies": [r.fhir.get("code", {}).get("text") for r in records if r.type == "allergy"],
        "conditions": [r.fhir.get("condition", "Unknown") for r in records if r.type == "condition"],
        "medications": [r.fhir.get("medication", "Unknown") for r in records if r.type == "medication"],
        "records_count": len(records)
    }
