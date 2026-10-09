from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from app.deps import CurrentPatient, SessionDep
from app.models import Share, Record, AuditLog, Patient, User
from app.auth import get_password_hash, verify_password

router = APIRouter(tags=["shares"])

class CreateShare(BaseModel):
    scope: dict
    expires_in_hours: int
    pin: Optional[str] = None

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def log_audit(db, patient_id, actor_type, actor_label, action, share_id=None, detail=None):
    audit = AuditLog(
        patient_id=patient_id,
        actor_type=actor_type,
        actor_label=actor_label,
        action=action,
        share_id=share_id,
        detail=detail
    )
    db.add(audit)
    db.commit()

@router.post("/shares")
def create_share(req: CreateShare, patient: CurrentPatient, db: SessionDep, request: Request):
    token = secrets.token_urlsafe(32)
    t_hash = hash_token(token)
    
    pin_hash = get_password_hash(req.pin) if req.pin else None
    
    expires = datetime.now(timezone.utc) + timedelta(hours=req.expires_in_hours)
    
    share = Share(
        patient_id=patient.id,
        token_hash=t_hash,
        scope=req.scope,
        pin_hash=pin_hash,
        expires_at=expires
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    
    log_audit(db, patient.id, "patient", "Self", "Created Share", share.id, f"Expires in {req.expires_in_hours}h")
    
    return {
        "id": share.id,
        "token": token,
        "expires_at": share.expires_at,
        "url": f"{request.base_url.scheme}://{request.base_url.hostname}:3000/shared/{token}"
    }

@router.get("/shares")
def list_shares(patient: CurrentPatient, db: SessionDep):
    shares = db.query(Share).filter(Share.patient_id == patient.id).order_by(Share.created_at.desc()).all()
    now = datetime.now(timezone.utc)
    
    return [{
        "id": s.id,
        "scope": s.scope,
        "expires_at": s.expires_at,
        "revoked_at": s.revoked_at,
        "created_at": s.created_at,
        "is_active": s.revoked_at is None and s.expires_at > now
    } for s in shares]

@router.delete("/shares/{id}")
def revoke_share(id: str, patient: CurrentPatient, db: SessionDep):
    share = db.query(Share).filter(Share.id == id, Share.patient_id == patient.id).first()
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
        
    if share.revoked_at:
        return {"message": "Already revoked"}
        
    share.revoked_at = datetime.now(timezone.utc)
    db.commit()
    
    log_audit(db, patient.id, "patient", "Self", "Revoked Share", share.id)
    return {"message": "Share revoked"}

class ShareAuth(BaseModel):
    pin: Optional[str] = None

@router.post("/shared/{token}")
def get_shared_records(token: str, auth: ShareAuth, db: SessionDep, request: Request):
    t_hash = hash_token(token)
    share = db.query(Share).filter(Share.token_hash == t_hash).first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Access ended or invalid link")
        
    now = datetime.now(timezone.utc)
    if share.revoked_at or share.expires_at < now:
        raise HTTPException(status_code=403, detail="Access ended or expired")
        
    # Check PIN
    if share.pin_hash:
        if not auth.pin or not verify_password(auth.pin, share.pin_hash):
            raise HTTPException(status_code=401, detail="Invalid PIN required")
            
    # Get Patient
    patient = db.query(Patient).filter(Patient.id == share.patient_id).first()
    user = db.query(User).filter(User.id == patient.user_id).first()
    
    # Get Records based on scope
    # Scope example: {"types": ["condition", "medication", "observation", "allergy"]}
    allowed_types = share.scope.get("types", [])
    
    records = db.query(Record).filter(
        Record.patient_id == patient.id,
        Record.verified == True,
        Record.type.in_(allowed_types)
    ).order_by(Record.recorded_date.desc()).all()
    
    # Log access
    client_ip = request.client.host if request.client else "Unknown"
    log_audit(db, patient.id, "clinician", client_ip, "Viewed Share", share.id)
    
    return {
        "patient": {
            "name": user.name,
            "dob": patient.dob,
            "blood_group": patient.blood_group
        },
        "share": {
            "expires_at": share.expires_at,
            "scope": share.scope
        },
        "records": [{
            "id": r.id,
            "type": r.type,
            "fhir": r.fhir,
            "source_name": r.source_name,
            "recorded_date": r.recorded_date
        } for r in records]
    }

@router.post("/emergency")
def create_emergency_card(patient: CurrentPatient, db: SessionDep, request: Request):
    # Check if one exists
    existing = db.query(Share).filter(Share.patient_id == patient.id, Share.is_emergency == True, Share.revoked_at == None).first()
    if existing:
        # We don't have the original token, so revoke and create new, or just return success if we don't care.
        # Actually, for MVP, we just create a new one every time the patient wants to generate a new QR.
        existing.revoked_at = datetime.now(timezone.utc)
        db.commit()
        
    token = secrets.token_urlsafe(32)
    t_hash = hash_token(token)
    
    share = Share(
        patient_id=patient.id,
        token_hash=t_hash,
        scope={"types": ["condition", "medication", "allergy"]}, # Emergency scope is fixed
        expires_at=datetime.now(timezone.utc) + timedelta(days=365*10), # effectively no expiry
        is_emergency=True
    )
    db.add(share)
    db.commit()
    
    log_audit(db, patient.id, "patient", "Self", "Generated Emergency Card", share.id)
    
    return {
        "url": f"{request.base_url.scheme}://{request.base_url.hostname}:3000/er/{token}"
    }

@router.get("/emergency/{token}")
def get_emergency_card(token: str, db: SessionDep, request: Request):
    t_hash = hash_token(token)
    share = db.query(Share).filter(Share.token_hash == t_hash, Share.is_emergency == True).first()
    
    if not share or share.revoked_at:
        raise HTTPException(status_code=404, detail="Invalid emergency card")
        
    patient = db.query(Patient).filter(Patient.id == share.patient_id).first()
    user = db.query(User).filter(User.id == patient.user_id).first()
    
    records = db.query(Record).filter(
        Record.patient_id == patient.id,
        Record.verified == True,
        Record.type.in_(["condition", "medication", "allergy"])
    ).all()
    
    client_ip = request.client.host if request.client else "Unknown"
    log_audit(db, patient.id, "er_staff", client_ip, "Scanned Emergency Card", share.id)
    
    return {
        "patient": {
            "name": user.name,
            "dob": patient.dob,
            "blood_group": patient.blood_group,
            "emergency_contact": patient.emergency_contact
        },
        "records": [{
            "type": r.type,
            "fhir": r.fhir
        } for r in records]
    }
