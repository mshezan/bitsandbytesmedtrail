from app.database import SessionLocal
from app.models import Patient, Record
from app.pipeline.engine import IngestionPipeline
import json, hashlib

db = SessionLocal()
pipeline = IngestionPipeline(db, "mock-test")

payload = {"test": "HbA1c", "value": "7.5"}
demo = {"name": "Test Patient", "phone": "+919999999999"}
content_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

print("Initial records with hash:", db.query(Record).filter(Record.content_hash == content_hash).count())

pipeline.process_payload(payload, "MRN-1", demo)
r1 = db.query(Record).filter(Record.source_id == "MRN-1").count()
print("After first:", r1)

pipeline.process_payload(payload, "MRN-1", demo)
r2 = db.query(Record).filter(Record.source_id == "MRN-1").count()
print("After second:", r2)
