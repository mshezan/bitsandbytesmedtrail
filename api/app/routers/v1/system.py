from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from sqlalchemy.orm import Session
from app.deps import get_db
from app.models import ApiKey, Patient, Record, Organization, Consent
from sqlalchemy import func
import hashlib
from datetime import datetime, timezone
from app.config import settings

router = APIRouter()

def verify_api_key(x_api_key: str = Header(...), db: Session = Depends(get_db)):
    key_hash = hashlib.sha256(x_api_key.encode()).hexdigest()
    api_key = db.query(ApiKey).filter(ApiKey.hash == key_hash, ApiKey.revoked_at.is_(None)).first()
    if api_key:
        api_key.last_used_at = datetime.now(timezone.utc)
        db.commit()
        org = db.query(Organization).filter(Organization.id == api_key.org_id, Organization.status == "active").first()
        if org:
            return org
        raise HTTPException(status_code=401, detail="API key organization is inactive")
    if settings.demo_mode and x_api_key == "test-key-123":
        org = db.query(Organization).filter(Organization.status == "active").first()
        if org:
            return org
    raise HTTPException(status_code=401, detail="Invalid API Key")

@router.get("/patients/lookup")
def lookup_patient(abha: str, org: Organization = Depends(verify_api_key), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.abha_number == abha).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    consent = db.query(Consent).filter(
        Consent.patient_id == patient.id, Consent.org_id == org.id,
        Consent.status == "active", Consent.expires_at > datetime.now(timezone.utc)
    ).first()
    if not consent:
        raise HTTPException(status_code=403, detail="Active patient consent is required")
    
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
