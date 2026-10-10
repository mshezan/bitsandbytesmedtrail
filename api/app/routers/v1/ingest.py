from fastapi import APIRouter, Depends, HTTPException, Header, Request, Query
from sqlalchemy.orm import Session
from app.deps import get_db
from app.models import Organization, SourceSync, Record, Patient, Consent
from app.adapters.fhir import FHIRConnector
from .system import verify_api_key
import datetime
import uuid
from datetime import date
import csv
import io
import json

def record_date(resource):
    value = resource.get("effectiveDateTime") or resource.get("issued") or resource.get("recorded")
    if value:
        try: return date.fromisoformat(value[:10])
        except (TypeError, ValueError): pass
    return date.today()

router = APIRouter()

@router.post("/ingest/bundle")
async def ingest_bundle(req: Request, patient_id: uuid.UUID = Query(...), org: Organization = Depends(verify_api_key), db: Session = Depends(get_db)):
    body = await req.body()
    if len(body) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="FHIR bundle exceeds the 10 MB limit")
    try:
        data = json.loads(body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="Request body must contain valid JSON")
    conn = FHIRConnector(org_id=str(org.id))

    if not conn.validate(data):
        raise HTTPException(status_code=400, detail="Invalid FHIR Bundle")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    consent = db.query(Consent).filter(
        Consent.patient_id == patient.id, Consent.org_id == org.id,
        Consent.status == "active", Consent.expires_at > datetime.datetime.now(datetime.timezone.utc)
    ).first()
    if not consent:
        raise HTTPException(status_code=403, detail="Active patient consent is required before ingesting records")

    sync = SourceSync(id=uuid.uuid4(), org_id=org.id, status="processing")
    db.add(sync)
        
    records = conn.normalize(data)
    kind_map = {"Observation": "observation", "Condition": "condition", "MedicationRequest": "medication", "MedicationStatement": "medication", "Encounter": "encounter", "AllergyIntolerance": "allergy", "DiagnosticReport": "report"}
    existing = db.query(Record).filter(Record.patient_id == patient.id, Record.source_org_id == org.id).all()
    seen = {(r.type, r.recorded_date, json.dumps(r.fhir, sort_keys=True, default=str)) for r in existing}
    saved = failed = 0
    for resource in records:
        kind = kind_map.get(resource.get("resourceType"))
        if not kind: continue
        subject = resource.get("subject") or resource.get("patient") or {}
        reference = subject.get("reference", "") if isinstance(subject, dict) else ""
        if reference.startswith("Patient/") and reference.split("/", 1)[1] != str(patient.id):
            failed += 1
            continue
        if kind not in consent.scope.split(","):
            failed += 1
            continue
        rec_date = record_date(resource)
        signature = (kind, rec_date, json.dumps(resource, sort_keys=True, default=str))
        if signature in seen: continue
        db.add(Record(patient_id=patient.id, type=kind, fhir=resource,
                      source_name=org.name, source_type="connector",
                      recorded_date=rec_date, confidence=1.0, verified=True,
                      source_org_id=org.id))
        seen.add(signature)
        saved += 1
    
    sync.status = "completed" if failed == 0 else "completed_with_errors"
    sync.records_added = saved
    sync.errors = failed
    sync.completed_at = datetime.datetime.utcnow()
    db.commit()

    return {
        "status": "success",
        "sync_id": sync.id,
        "report": {
            "mapped": saved,
            "failed": failed,
            "warnings": (["Some resources were outside the granted consent scope"] if failed else [])
        }
    }

@router.post("/ingest/csv")
async def ingest_csv(req: Request, patient_id: uuid.UUID = Query(...), org: Organization = Depends(verify_api_key), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    consent = db.query(Consent).filter(
        Consent.patient_id == patient.id, Consent.org_id == org.id,
        Consent.status == "active", Consent.expires_at > datetime.datetime.now(datetime.timezone.utc)
    ).first()
    if not consent or "observation" not in consent.scope.split(","):
        raise HTTPException(status_code=403, detail="Active consent for lab observations is required")
    body = await req.body()
    if len(body) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="CSV exceeds the 5 MB limit")
    try:
        reader = csv.DictReader(io.StringIO(body.decode("utf-8-sig")))
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded")
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV must include headers")
    mapped = failed = 0
    sync = SourceSync(id=uuid.uuid4(), org_id=org.id, status="processing")
    db.add(sync)
    for row_index, row in enumerate(reader):
        if row_index >= 10000:
            failed += sum(1 for _ in reader) + 1
            break
        name = (row.get("test") or row.get("test_name") or row.get("observation") or "").strip()
        if not name:
            failed += 1
            continue
        value_text = (row.get("value") or "").strip()
        try: value = float(value_text) if value_text else None
        except ValueError:
            failed += 1
            continue
        raw_date = (row.get("date") or row.get("recorded_date") or "").strip()
        try: recorded = date.fromisoformat(raw_date[:10]) if raw_date else date.today()
        except ValueError:
            failed += 1
            continue
        resource = {"resourceType": "Observation", "status": "final", "subject": {"reference": f"Patient/{patient.id}"},
                    "code": {"text": name}, "valueQuantity": {"value": value, "unit": (row.get("unit") or "").strip()}}
        duplicate = db.query(Record.id).filter(Record.patient_id == patient.id,
            Record.source_org_id == org.id, Record.type == "observation",
            Record.recorded_date == recorded, Record.fhir == resource).first()
        if duplicate:
            continue
        db.add(Record(patient_id=patient.id, type="observation", fhir=resource,
                      source_name=(row.get("source") or org.name).strip(), source_type="connector",
                      recorded_date=recorded, confidence=1.0, verified=True, source_org_id=org.id))
        mapped += 1
    sync.status = "completed" if failed == 0 else "completed_with_errors"
    sync.records_added = mapped
    sync.errors = failed
    sync.completed_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "success", "sync_id": sync.id, "report": {"mapped": mapped, "failed": failed, "warnings": []}}

@router.post("/ingest/document")
async def ingest_document(req: Request, org: Organization = Depends(verify_api_key), db: Session = Depends(get_db)):
    raise HTTPException(status_code=501, detail="Provider document ingestion is not configured; patients can upload documents from their portal")
