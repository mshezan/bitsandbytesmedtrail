from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from typing import List
import uuid
import os
import tempfile
from app.deps import CurrentPatient, SessionDep
from app.models import FileObject, Record
from app.storage import minio_client
from app.config import settings
from app.extraction import process_file_extraction

router = APIRouter(prefix="/uploads", tags=["uploads"])

from app.database import SessionLocal

def process_upload_bg(file_path: str, mime_type: str, patient_id: uuid.UUID, file_id: uuid.UUID):
    db_session = SessionLocal()
    try:
        extracted = process_file_extraction(file_path, mime_type)
        
        # Save extracted items as unverified records
        if extracted.conditions:
            for cond in extracted.conditions:
                db_session.add(Record(
                    patient_id=patient_id, type="condition",
                    fhir={"resourceType": "Condition", "code": {"text": cond.name}},
                    source_name=extracted.provider or "Upload", source_type="upload",
                    recorded_date=extracted.date or "2023-01-01", confidence=extracted.confidence,
                    verified=False, file_id=file_id
                ))
        
        if extracted.medications:
            for med in extracted.medications:
                db_session.add(Record(
                    patient_id=patient_id, type="medication",
                    fhir={"resourceType": "MedicationStatement", "medicationCodeableConcept": {"text": med.name}, "dosageInstruction": [{"text": f"{med.dose} {med.frequency}"}]},
                    source_name=extracted.provider or "Upload", source_type="upload",
                    recorded_date=extracted.date or "2023-01-01", confidence=extracted.confidence,
                    verified=False, file_id=file_id
                ))
                
        if extracted.observations:
            for obs in extracted.observations:
                db_session.add(Record(
                    patient_id=patient_id, type="observation",
                    fhir={"resourceType": "Observation", "code": {"text": obs.name}, "valueQuantity": {"value": obs.value, "unit": obs.unit}},
                    source_name=extracted.provider or "Upload", source_type="upload",
                    recorded_date=obs.date or extracted.date or "2023-01-01", confidence=extracted.confidence,
                    verified=False, file_id=file_id
                ))
                
        db_session.commit()
    except Exception as e:
        print(f"Extraction error: {e}")
    finally:
        db_session.close()
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("")
async def upload_file(patient: CurrentPatient, db: SessionDep, background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # Validate file size conceptually (handled mostly by web server limits, but MVP logic here)
    if not file.content_type.startswith("image/") and file.content_type != "application/pdf":
        raise HTTPException(400, "Invalid file type. Must be PDF or image.")
        
    s3 = minio_client()
    object_key = f"uploads/{patient.id}/{uuid.uuid4()}-{file.filename}"
    
    # Save temp file for extraction
    fd, temp_path = tempfile.mkstemp()
    with os.fdopen(fd, 'wb') as f:
        content = await file.read()
        f.write(content)
        
    # Upload to MinIO
    with open(temp_path, 'rb') as f:
        s3.put_object(
            Bucket=settings.minio_bucket,
            Key=object_key,
            Body=f,
            ContentType=file.content_type
        )
        
    # Create File DB record
    file_record = FileObject(
        patient_id=patient.id,
        object_key=object_key,
        mime=file.content_type,
        original_name=file.filename
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)
    
    # Trigger bg task
    background_tasks.add_task(process_upload_bg, temp_path, file.content_type, patient.id, file_record.id)
    
    return {"message": "File uploaded, extraction started", "file_id": file_record.id}
