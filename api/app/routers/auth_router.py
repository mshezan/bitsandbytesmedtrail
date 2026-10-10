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
        # In a real app, verify against Redis/DB
        if req.code != "123456":
            raise HTTPException(status_code=400, detail="Invalid OTP")
            
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

from pydantic import BaseModel
class UpdateMeRequest(BaseModel):
    emergency: str | None = None
    blood_group: str | None = None

@router.patch("/me")
def update_me(req: UpdateMeRequest, user: CurrentUser, db: SessionDep):
    if user.role == "patient":
        from app.models import Patient
        patient = db.query(Patient).filter(Patient.user_id == user.id).first()
        if patient:
            if req.emergency is not None:
                patient.emergency = req.emergency
            if req.blood_group is not None:
                patient.blood_group = req.blood_group
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
        
    # Mock password and OTP check for demo
    if req.password != "password" or req.otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid credentials or OTP")
        
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}
