from fastapi import APIRouter
from app.deps import CurrentPatient, SessionDep
from app.models import AuditLog, AccessEvent, Organization, Staff, User

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("")
def list_audit(patient: CurrentPatient, db: SessionDep):
    logs = db.query(AuditLog).filter(AuditLog.patient_id == patient.id).order_by(AuditLog.created_at.desc()).all()
    result = [{
        "id": a.id,
        "actor_type": a.actor_type,
        "actor_label": a.actor_label,
        "action": a.action,
        "detail": a.detail,
        "created_at": a.created_at
    } for a in logs]
    events = db.query(AccessEvent, Organization, Staff, User).join(
        Organization, AccessEvent.org_id == Organization.id
    ).outerjoin(Staff, AccessEvent.staff_id == Staff.id).outerjoin(
        User, Staff.user_id == User.id
    ).filter(AccessEvent.patient_id == patient.id).all()
    result.extend({
        "id": event.id,
        "actor_type": "clinician",
        "actor_label": clinician.name if clinician else organization.name,
        "action": event.purpose,
        "detail": f"Scope: {event.scope}; records viewed: {event.records_viewed}",
        "created_at": event.created_at,
    } for event, organization, _staff, clinician in events)
    return sorted(result, key=lambda item: item["created_at"], reverse=True)
