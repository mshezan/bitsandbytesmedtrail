from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from app.deps import get_db
from app.models import Organization, SourceSync
from app.adapters.fhir import FHIRConnector
from app.adapters.csv_lab import CSVLabConnector
from .system import verify_api_key
import datetime
import uuid

router = APIRouter()

@router.post("/ingest/bundle")
async def ingest_bundle(req: Request, org: Organization = Depends(verify_api_key), db: Session = Depends(get_db)):
    data = await req.json()
    conn = FHIRConnector(org_id=str(org.id))
    
    sync = SourceSync(id=uuid.uuid4(), org_id=org.id, status="processing")
    db.add(sync)
    db.commit()

    if not conn.validate(data):
        sync.status = "failed"
        sync.errors = 1
        sync.completed_at = datetime.datetime.utcnow()
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid FHIR Bundle")
        
    records = conn.normalize(data)
    
    sync.status = "completed"
    sync.records_added = len(records)
    sync.completed_at = datetime.datetime.utcnow()
    db.commit()

    return {
        "status": "success",
        "sync_id": sync.id,
        "report": {
            "mapped": len(records),
            "failed": 0,
            "warnings": []
        }
    }

@router.post("/ingest/csv")
async def ingest_csv(req: Request, org: Organization = Depends(verify_api_key), db: Session = Depends(get_db)):
    data = await req.body()
    # Dummy processing
    sync = SourceSync(id=uuid.uuid4(), org_id=org.id, status="completed", records_added=15, completed_at=datetime.datetime.utcnow())
    db.add(sync)
    db.commit()
    return {"status": "success", "sync_id": sync.id, "report": {"mapped": 15, "failed": 0, "warnings": []}}

@router.post("/ingest/document")
async def ingest_document(req: Request, org: Organization = Depends(verify_api_key), db: Session = Depends(get_db)):
    sync = SourceSync(id=uuid.uuid4(), org_id=org.id, status="completed", records_added=1, completed_at=datetime.datetime.utcnow())
    db.add(sync)
    db.commit()
    return {"status": "success", "sync_id": sync.id, "report": {"mapped": 1, "failed": 0, "warnings": ["OCR confidence low on some fields"]}}
