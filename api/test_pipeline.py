from app.database import SessionLocal
from app.models import Patient, Record, IntegrationQueue
from app.pipeline.engine import IngestionPipeline

def test_idempotency():
    db = SessionLocal()
    pipeline = IngestionPipeline(db, "mock-test")
    
    payload = {"test": "HbA1c", "value": "7.5"}
    
    # We must match an existing seeded patient. Let's find one.
    existing_p = db.query(Patient).first()
    demo = {"name": existing_p.user.name, "phone": existing_p.user.phone}
    
    # First sync
    pipeline.process_payload(payload, "MRN-1", demo)
    records_1 = db.query(Record).filter(Record.source_id == "MRN-1").count()
    
    # Second sync (identical)
    pipeline.process_payload(payload, "MRN-1", demo)
    records_2 = db.query(Record).filter(Record.source_id == "MRN-1").count()
    
    # Wait, the pipeline hashes the FHIR payload. Our mapping turns `HbA1c` to `4548-4`, which is deterministic.
    assert records_1 > 0, "No records created on first pass!"
    assert records_1 == records_2, "Idempotency failed: record was duplicated"
    print("Idempotency Test: PASS")

def test_identity_resolution():
    db = SessionLocal()
    pipeline = IngestionPipeline(db, "mock-test")
    
    existing_p = db.query(Patient).first()
    
    # Ambiguous match: Same phone, slightly different name (e.g. "Rahul Varma")
    # Score must be between 0.6 and 0.85. 
    # Let's mock a name that's similar but not exact.
    # difflib.SequenceMatcher(None, "Ramesh Iyer", "Ramesh Ayer").ratio() -> 11 / 11 = 1.0? 
    # Actually 'Ramesh Iyer' vs 'Ramesh Ayer' is 10/11 = ~0.9.
    # Let's use something that yields ~0.7. 'Ramesh Iyer' vs 'Ram Iyer' = 8/11 = 0.72!
    demo_ambiguous = {"name": existing_p.user.name.split()[0] + " X", "phone": existing_p.user.phone}
    
    pipeline.process_payload({"test": "BP"}, "MRN-AMBIG", demo_ambiguous)
    
    q = db.query(IntegrationQueue).filter(IntegrationQueue.queue_type == "identity_review").first()
    assert q is not None, "Identity Test failed: Ambiguous match did not enter review queue"
    print("Identity Resolution Test: PASS (Ambiguity trapped)")

def test_mapping_queue():
    db = SessionLocal()
    pipeline = IngestionPipeline(db, "mock-test")
    
    # Unmapped terminology
    try:
        pipeline.process_payload({"test": "UNKNOWN_LOCAL_CODE"}, "MRN-MAP", {"name": "Test"})
    except ValueError:
        pass
        
    q = db.query(IntegrationQueue).filter(IntegrationQueue.queue_type == "mapping_review").first()
    assert q is not None, "Mapping Test failed: Unmapped item did not enter mapping queue"
    print("Terminology Mapping Test: PASS (Unmapped isolated)")

def test_resilience_dlq():
    db = SessionLocal()
    pipeline = IngestionPipeline(db, "mock-test")
    
    # Crash
    pipeline.process_payload({"test": "BP"}, "MRN-BAD", None) # None for demo will crash .get()
    
    q = db.query(IntegrationQueue).filter(IntegrationQueue.queue_type == "dlq").first()
    assert q is not None, "Resilience Test failed: Crash did not hit DLQ"
    print("Resilience / DLQ Test: PASS (Crash trapped)")

if __name__ == "__main__":
    print("Running Pipeline Verification Suite...")
    test_idempotency()
    test_identity_resolution()
    test_mapping_queue()
    test_resilience_dlq()
    print("All Pipeline Assertions Passed.")
