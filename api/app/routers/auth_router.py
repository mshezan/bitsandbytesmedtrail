import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas import OTPRequest, OTPVerify, Token
from app.deps import SessionDep, CurrentUser
from app.models import User
from app.config import settings
from app.auth import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])
log = logging.getLogger(__name__)

@router.post("/otp/request")
def request_otp(req: OTPRequest, db: SessionDep):
    from app.models import Patient
    user = db.query(User).filter(User.phone == req.phone).first()
    if not user:
        patient = db.query(Patient).filter(Patient.abha_number == req.phone).first()
        if patient:
            user = patient.user
    if not user:
        # In a real app, you might register here or return an error.
        # For the demo, let's just say "User not found" if they are not in the seed DB.
        raise HTTPException(status_code=404, detail="Phone number not registered")
    
    # In a real app, trigger SMS here
    if settings.demo_mode:
        log.info(f"Demo mode: OTP requested for {req.phone}. Use {settings.demo_otp}")
        
    return {"message": "OTP sent successfully"}

@router.post("/otp/verify", response_model=Token)
def verify_otp(req: OTPVerify, db: SessionDep):
    from app.models import Patient
    user = db.query(User).filter(User.phone == req.phone).first()
    if not user:
        patient = db.query(Patient).filter(Patient.abha_number == req.phone).first()
        if patient:
            user = patient.user
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if settings.demo_mode:
        if req.code != settings.demo_otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")
    else:
        raise HTTPException(status_code=503, detail="OTP delivery is not configured")
            
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import or_
class UpdateMeRequest(BaseModel):
    emergency: str | None = None
    phone: str | None = Field(default=None, min_length=5, max_length=32)
    email: str | None = Field(default=None, max_length=255)
    address: str | None = Field(default=None, max_length=500)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    language: str | None = Field(default=None, max_length=64)
    preferred_hospital: str | None = Field(default=None, max_length=200)
    notification_preferences: dict | None = None
    privacy_preferences: dict | None = None
    profile_photo_url: str | None = Field(default=None, max_length=512)
    model_config = ConfigDict(extra="forbid")

@router.patch("/me")
def update_me(req: UpdateMeRequest, user: CurrentUser, db: SessionDep):
    if user.role == "patient":
        from app.models import Patient
        patient = db.query(Patient).filter(Patient.user_id == user.id).first()
        if patient:
            if req.phone and db.query(User).filter(User.phone == req.phone, User.id != user.id).first():
                raise HTTPException(status_code=409, detail="Phone number is already in use")
            if req.email and db.query(User).filter(User.email == req.email, User.id != user.id).first():
                raise HTTPException(status_code=409, detail="Email address is already in use")
            if req.emergency is not None:
                patient.emergency_contact = req.emergency
            if req.phone is not None:
                user.phone = req.phone
                patient.phone = req.phone
            if req.email is not None:
                user.email = req.email
            for field in ("address", "city", "state", "language", "preferred_hospital", "profile_photo_url"):
                value = getattr(req, field)
                if value is not None:
                    setattr(patient, field, value)
            if req.notification_preferences is not None:
                patient.notification_preferences = req.notification_preferences
            if req.privacy_preferences is not None:
                patient.privacy_preferences = req.privacy_preferences
            from app.models import AuditLog
            db.add(AuditLog(patient_id=patient.id, actor_type="patient", actor_label="Self",
                            action="Updated personal profile", detail="Patient-owned profile settings"))
            db.commit()
    return {"status": "updated"}

class HospitalLoginRequest(BaseModel):
    hospital_id: str
    email: str
    password: str
    otp: str

@router.post("/hospital/login", response_model=Token)
def hospital_login(req: HospitalLoginRequest, db: SessionDep):
    from app.models import Organization, Staff
    org = db.query(Organization).filter(Organization.registration_no == req.hospital_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Hospital not found")
        
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff not found")
        
    staff = db.query(Staff).filter(Staff.user_id == user.id, Staff.org_id == org.id).first()
    if not staff:
        raise HTTPException(status_code=403, detail="Staff does not belong to this hospital")
        
    if not settings.demo_mode:
        raise HTTPException(status_code=503, detail="Hospital authentication is not configured")
    if req.password != "password123" or req.otp != settings.demo_otp:
        raise HTTPException(status_code=400, detail="Invalid credentials or OTP")
        
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}
