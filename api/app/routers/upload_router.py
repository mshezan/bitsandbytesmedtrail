from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Form
from typing import List
import uuid
import os
import tempfile
import re
from difflib import SequenceMatcher
from datetime import date
from app.deps import CurrentPatient, SessionDep
from app.models import FileObject, Record
from app.storage import minio_client
from app.config import settings
from app.extraction import process_file_extraction

router = APIRouter(prefix="/uploads", tags=["uploads"])

from app.database import SessionLocal

def process_upload_bg(file_path: str, mime_type: str, patient_id: uuid.UUID, file_id: uuid.UUID, external_source_name: str):
    db_session = SessionLocal()
    try:
        extracted = process_file_extraction(file_path, mime_type)
        
        # Save extracted items as unverified records
        def parsed_date(value):
            try: return date.fromisoformat(value[:10]) if value else date.today()
            except (TypeError, ValueError): return date.today()

        if extracted.conditions:
            for cond in extracted.conditions:
                db_session.add(Record(
                    patient_id=patient_id, type="condition",
                    fhir={"resourceType": "Condition", "code": {"text": cond.name}},
                    source_name=external_source_name, source_type="upload",
                    recorded_date=parsed_date(extracted.date), confidence=extracted.confidence,
                    verified=False, file_id=file_id
                ))
        
        if extracted.medications:
            for med in extracted.medications:
                db_session.add(Record(
                    patient_id=patient_id, type="medication",
                    fhir={"resourceType": "MedicationStatement", "medicationCodeableConcept": {"text": med.name}, "dosage": [{"text": " ".join(part for part in [med.dose, med.frequency, med.duration] if part)}]},
                    source_name=external_source_name, source_type="upload",
                    recorded_date=parsed_date(extracted.date), confidence=extracted.confidence,
                    verified=False, file_id=file_id
                ))
                
        if extracted.observations:
            for obs in extracted.observations:
                db_session.add(Record(
                    patient_id=patient_id, type="observation",
                    fhir={"resourceType": "Observation", "code": {"text": obs.name}, "valueQuantity": {"value": obs.value, "unit": obs.unit}},
                    source_name=external_source_name, source_type="upload",
                    recorded_date=parsed_date(obs.date or extracted.date), confidence=extracted.confidence,
                    verified=False, file_id=file_id
                ))

        for allergy in extracted.allergies:
            db_session.add(Record(
                patient_id=patient_id, type="allergy",
                fhir={"resourceType": "AllergyIntolerance", "code": {"text": allergy.substance}, "reaction": allergy.reaction},
                source_name=external_source_name, source_type="upload",
                recorded_date=parsed_date(extracted.date), confidence=extracted.confidence,
                verified=False, file_id=file_id
            ))
                
        db_session.commit()
    except Exception:
        db_session.rollback()
    finally:
        db_session.close()
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("")
async def upload_file(patient: CurrentPatient, db: SessionDep, background_tasks: BackgroundTasks,
                      source_name: str = Form(..., min_length=3, max_length=200),
                      file: UploadFile = File(...)):
    from app.models import Organization, AuditLog
    source_name = " ".join(source_name.split())
    key = re.sub(r"[^a-z0-9]", "", source_name.casefold())
    organizations = db.query(Organization).filter(Organization.status == "active").all()
    source_tokens = {token for token in re.findall(r"[a-z0-9]+", source_name.casefold()) if len(token) > 2}
    for organization in organizations:
        candidates = [organization.name, organization.registration_no or ""]
        for candidate in candidates:
            candidate_key = re.sub(r"[^a-z0-9]", "", candidate.casefold())
            candidate_tokens = {token for token in re.findall(r"[a-z0-9]+", candidate.casefold()) if len(token) > 2}
            shared_tokens = source_tokens.intersection(candidate_tokens)
            if (key == candidate_key or
                (len(key) >= 8 and len(candidate_key) >= 8 and SequenceMatcher(None, key, candidate_key).ratio() >= 0.80) or
                (len(shared_tokens) >= 2 and len(shared_tokens) / max(1, len(candidate_tokens)) >= 0.67)):
                raise HTTPException(status_code=403, detail=f"{organization.name} is connected to MedTrail. Import its records through the provider API instead of uploading a copy.")
    if file.content_type not in {"image/jpeg", "image/png", "image/webp", "application/pdf"}:
        raise HTTPException(400, "Invalid file type. Must be PDF or image.")
        
    s3 = minio_client()
    object_key = f"uploads/{patient.id}/{uuid.uuid4()}"
    
    # Save temp file for extraction
    fd, temp_path = tempfile.mkstemp()
    with os.fdopen(fd, 'wb') as f:
        content = await file.read(10 * 1024 * 1024 + 1)
        if len(content) > 10 * 1024 * 1024:
            os.unlink(temp_path)
            raise HTTPException(413, "File exceeds the 10 MB upload limit")
        signatures = {
            "application/pdf": content.startswith(b"%PDF"),
            "image/jpeg": content.startswith(b"\xff\xd8\xff"),
            "image/png": content.startswith(b"\x89PNG\r\n\x1a\n"),
            "image/webp": len(content) >= 12 and content.startswith(b"RIFF") and content[8:12] == b"WEBP",
        }
        if not content or not signatures.get(file.content_type, False):
            os.unlink(temp_path)
            raise HTTPException(400, "File content does not match its declared type")
        f.write(content)
        
    # Upload to MinIO
    try:
        with open(temp_path, 'rb') as f:
            s3.put_object(
                Bucket=settings.minio_bucket,
                Key=object_key,
                Body=f,
                ContentType=file.content_type
            )
    except Exception:
        os.remove(temp_path)
        raise HTTPException(503, "Document storage is temporarily unavailable")
        
    # Create File DB record
    file_record = FileObject(
        patient_id=patient.id,
        object_key=object_key,
        mime=file.content_type,
        original_name=(file.filename or "medical-document")[:255]
    )
    db.add(file_record)
    db.add(AuditLog(patient_id=patient.id, actor_type="patient", actor_label="Self",
                    action="Uploaded external provider document", detail=source_name))
    db.commit()
    db.refresh(file_record)
    
    # Trigger bg task
    background_tasks.add_task(process_upload_bg, temp_path, file.content_type, patient.id, file_record.id, source_name)
    
    return {"message": "File uploaded, extraction started", "file_id": file_record.id}
