from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from sqlalchemy.orm import Session
from app.deps import get_db
from app.models import ApiKey, Patient, Record, Organization
from sqlalchemy import func

router = APIRouter()

def verify_api_key(x_api_key: str = Header(...), db: Session = Depends(get_db)):
    # In a real system, we'd hash the key and compare
    # For prototype, assume key is raw and matches hash column or just find any key
    # Let's mock validation: if x_api_key is "test-key-123", it passes.
    if x_api_key == "test-key-123":
        org = db.query(Organization).first() # just grab one for demo
        return org
    raise HTTPException(status_code=401, detail="Invalid API Key")

@router.get("/patients/lookup")
def lookup_patient(abha: str, org: Organization = Depends(verify_api_key), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.abha_number == abha).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return {
        "status": "success",
        "data": {
            "patient_id": patient.id,
            "abha": patient.abha_number,
            "name": patient.user.name if patient.user else "Unknown"
        }
    }

@router.get("/sources/status")
def source_status(org: Organization = Depends(verify_api_key), db: Session = Depends(get_db)):
    from app.models import SourceSync
    syncs = db.query(SourceSync).filter(SourceSync.org_id == org.id).order_by(SourceSync.started_at.desc()).limit(10).all()
    return {
        "status": "success",
        "org_name": org.name,
        "recent_syncs": [
            {
                "id": s.id,
                "status": s.status,
                "records_added": s.records_added,
                "errors": s.errors,
                "started_at": s.started_at
            } for s in syncs
        ]
    }
