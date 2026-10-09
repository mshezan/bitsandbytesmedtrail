import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas import OTPRequest, OTPVerify, Token
from app.deps import SessionDep
from app.models import User
from app.config import settings
from app.auth import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])
log = logging.getLogger(__name__)

@router.post("/otp/request")
def request_otp(req: OTPRequest, db: SessionDep):
    user = db.query(User).filter(User.phone == req.phone).first()
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
    user = db.query(User).filter(User.phone == req.phone).first()
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
