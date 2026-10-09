from fastapi import APIRouter, Depends
from app.deps import CurrentUser, CurrentPatient, SessionDep
from app.schemas import MeResponse
from app.models import Patient, Record

router = APIRouter(tags=["patient"])

@router.get("/me", response_model=MeResponse)
def get_me(user: CurrentUser, db: SessionDep):
    patient = None
    if user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == user.id).first()
        
    return {
        "user": user,
        "patient": patient
    }

@router.get("/dashboard")
def get_dashboard(patient: CurrentPatient, db: SessionDep):
    records_count = db.query(Record).filter(Record.patient_id == patient.id).count()
    sources_count = db.query(Record.source_name).filter(Record.patient_id == patient.id).distinct().count()
    active_meds = db.query(Record).filter(Record.patient_id == patient.id, Record.type == "medication").count()
    open_alerts = 3 # dummy

    # dummy sparkline
    sparkline = [10, 20, 15, 30, 25, 40, 35]

    recent_activity = db.query(Record).filter(Record.patient_id == patient.id).order_by(Record.recorded_date.desc()).limit(6).all()
    activity = [{"id": r.id, "type": r.type, "date": r.recorded_date, "source": r.source_name} for r in recent_activity]

    alerts = [
        {"id": 1, "severity": "high", "message": "Missing HbA1c"},
        {"id": 2, "severity": "medium", "message": "Low Vitamin D"},
        {"id": 3, "severity": "low", "message": "Upcoming Eye Checkup"}
    ]

    sources_query = db.query(Record.source_name, db.func.max(Record.recorded_date).label("last_sync"), db.func.count(Record.id).label("count"))\
        .filter(Record.patient_id == patient.id).group_by(Record.source_name).all()
    sources = [{"name": s.source_name, "last_sync": s.last_sync, "count": s.count, "status": "synced"} for s in sources_query]

    # Dummy completeness score
    completeness_score = 85

    return {
        "stat_counts": {
            "records": records_count,
            "sources": sources_count,
            "active_meds": active_meds,
            "open_alerts": open_alerts
        },
        "sparkline": sparkline,
        "recent_activity": activity,
        "alerts": alerts,
        "sources": sources,
        "completeness_score": completeness_score
    }

@router.get("/sources")
def get_sources(patient: CurrentPatient, db: SessionDep):
    sources_query = db.query(Record.source_name, db.func.max(Record.recorded_date).label("last_sync"), db.func.count(Record.id).label("count"))\
        .filter(Record.patient_id == patient.id).group_by(Record.source_name).all()
    sources = [{"name": s.source_name, "last_sync": s.last_sync, "count": s.count, "status": "synced"} for s in sources_query]
    return sources

@router.get("/visit-prep")
def get_visit_prep(patient: CurrentPatient, db: SessionDep):
    meds = db.query(Record).filter(Record.patient_id == patient.id, Record.type == "medication").all()
    conditions = db.query(Record).filter(Record.patient_id == patient.id, Record.type == "condition").all()
    recent_labs = db.query(Record).filter(Record.patient_id == patient.id, Record.type == "observation").order_by(Record.recorded_date.desc()).limit(5).all()

    return {
        "medications": [{"name": m.fhir.get("medication", m.fhir.get("code", {}).get("text", "Unknown")), "status": "active"} for m in meds],
        "conditions": [{"name": c.fhir.get("condition", c.fhir.get("code", {}).get("text", "Unknown"))} for c in conditions],
        "recent_labs": [{"name": l.fhir.get("observation", l.fhir.get("code", {}).get("text", "Unknown")), "value": l.fhir.get("valueQuantity", {}).get("value")} for l in recent_labs],
        "questions_to_ask": ["What about my blood pressure?", "Is the new medication working?"],
        "summary": "Patient is stable but needs followup on HbA1c."
    }

from app.insights import generate_insights

@router.get("/insights")
def get_insights(patient: CurrentPatient, db: SessionDep):
    return generate_insights(patient.id, db)
