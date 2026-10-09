import os
path = "api/app/routers/auth_router.py"
with open(path, "r") as f:
    content = f.read()

patch_code = """
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
"""
if "update_me" not in content:
    content += patch_code
    with open(path, "w") as f:
        f.write(content)
