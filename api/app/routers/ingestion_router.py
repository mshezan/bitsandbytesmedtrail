import hmac
import hashlib
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.pipeline.engine import IngestionPipeline

router = APIRouter(prefix="/ingest", tags=["Ingestion"])

HMAC_SECRET = b"demo_hmac_secret"

def verify_hmac(request: Request, body: bytes):
    signature = request.headers.get("X-Hub-Signature")
    if not signature:
        raise HTTPException(status_code=401, detail="Missing signature")
    
    expected = "sha256=" + hmac.new(HMAC_SECRET, body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="Invalid signature")

def run_pipeline(db, org_id, payload):
    pipeline = IngestionPipeline(db, org_id)
    # Extract mock demographics from payload
    demo = payload.get("patient", {})
    mrn = payload.get("mrn", "UNKNOWN")
    pipeline.process_payload(payload.get("data", {}), mrn, demo)

@router.post("/push/{org_id}")
async def push_webhook(org_id: str, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    body = await request.body()
    verify_hmac(request, body)
    
    import json
    payload = json.loads(body)
    
    # Run async to not block the webhook ack
    background_tasks.add_task(run_pipeline, db, org_id, payload)
    
    return {"status": "accepted"}

@router.post("/pull/{org_id}")
def trigger_pull(org_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Mock pull
    mock_payload = {
        "mrn": "PULL-123",
        "patient": {"name": "Priya Sharma", "phone": "+919876543210"},
        "data": {"test": "Glycosylated Hb", "value": "7.2"}
    }
    background_tasks.add_task(run_pipeline, db, org_id, mock_payload)
    return {"status": "pull_initiated"}
