from fastapi import APIRouter
from app.deps import CurrentPatient, SessionDep
from app.models import AuditLog

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("")
def list_audit(patient: CurrentPatient, db: SessionDep):
    logs = db.query(AuditLog).filter(AuditLog.patient_id == patient.id).order_by(AuditLog.created_at.desc()).all()
    
    return [{
        "id": a.id,
        "actor_type": a.actor_type,
        "actor_label": a.actor_label,
        "action": a.action,
        "detail": a.detail,
        "created_at": a.created_at
    } for a in logs]
