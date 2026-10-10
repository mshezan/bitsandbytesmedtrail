import re

with open("api/app/routers/auth_router.py", "r") as f:
    content = f.read()

new_endpoints = """
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
"""

content += new_endpoints

# Modify patient OTP request and verify to allow ABHA ID
content = content.replace(
    'user = db.query(User).filter(User.phone == req.phone).first()',
    '''from app.models import Patient
    user = db.query(User).filter(User.phone == req.phone).first()
    if not user:
        patient = db.query(Patient).filter(Patient.abha_number == req.phone).first()
        if patient:
            user = patient.user'''
)

with open("api/app/routers/auth_router.py", "w") as f:
    f.write(content)

