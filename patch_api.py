import os

care_router_path = "api/app/routers/care_router.py"
with open(care_router_path, "r") as f:
    content = f.read()

# Add POST /medications/{id}/resolve
if "/medications/{id}/resolve" not in content:
    resolve_endpoint = """
class ResolveReq(BaseModel):
    action: str  # 'keep', 'discontinued', 'ask_doctor'

@router.post("/medications/{id}/resolve")
def resolve_medication(id: uuid.UUID, req: ResolveReq, patient: CurrentPatient, db: SessionDep):
    record = db.query(Record).filter(Record.id == id, Record.patient_id == patient.id).first()
    if not record:
        raise HTTPException(status_code=404)
    record.fhir["conflict_resolution"] = req.action
    db.commit()
    # Log audit
    from app.routers.share_router import log_audit
    log_audit(db, patient.id, "patient", "Self", f"Resolved med conflict: {req.action}")
    return {"status": "success"}

class ProviderRequestReq(BaseModel):
    provider_name: str

@router.post("/providers/request")
def request_records(req: ProviderRequestReq, patient: CurrentPatient, db: SessionDep):
    from app.routers.share_router import log_audit
    log_audit(db, patient.id, "patient", "Self", f"Requested records from {req.provider_name}")
    return {"status": "requested"}
"""
    content += resolve_endpoint
    with open(care_router_path, "w") as f:
        f.write(content)

print("Backend patched.")
