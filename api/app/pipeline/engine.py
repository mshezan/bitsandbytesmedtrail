import json
import uuid
import hashlib
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import IntegrationQueue, PipelineLog, Patient, Record
import difflib

MOCK_MAPPINGS = {
    "tests": {
        "Glycosylated Hb": {"code": "4548-4", "display": "HbA1c"},
        "GHb": {"code": "4548-4", "display": "HbA1c"},
        "HbA1c": {"code": "4548-4", "display": "HbA1c"}
    },
    "drugs": {
        "Glycomet GP2": "Metformin + Glimepiride",
        "Tab Metformin 500 BD": "Metformin 500mg"
    }
}

class IngestionPipeline:
    def __init__(self, db: Session, org_id: str, run_id: str = None):
        self.db = db
        self.org_id = org_id
        self.run_id = run_id or str(uuid.uuid4())

    def log_stage(self, stage, status, metrics=None):
        log = PipelineLog(run_id=self.run_id, org_id=self.org_id, stage=stage, status=status, metrics=metrics or {})
        self.db.add(log)
        self.db.commit()

    def process_payload(self, raw_payload, source_mrn, patient_demographics):
        try:
            # 1 & 2. FETCH & PARSE
            self.log_stage("FETCH_PARSE", "success", {"size": len(str(raw_payload))})
            
            # 3. MAP
            mapped_data = self._map_data(raw_payload)
            self.log_stage("MAP", "success")

            # 4. VALIDATE
            self._validate(mapped_data)
            self.log_stage("VALIDATE", "success")

            # 5. IDENTITY RESOLUTION
            patient_id = self._resolve_identity(source_mrn, patient_demographics)
            if not patient_id:
                return # Held in queue

            # 6. DEDUPE
            if self._is_duplicate(patient_id, mapped_data):
                self.log_stage("DEDUPE", "success", {"result": "dropped_duplicate"})
                return

            # 7. STORE
            self._store(patient_id, mapped_data, source_mrn)
            
            # 8. POST-PROCESS
            self.log_stage("POST_PROCESS", "success")
            
        except Exception as e:
            self.log_stage("PIPELINE_ERROR", "error", {"error": str(e)})
            self.db.add(IntegrationQueue(queue_type="dlq", source_org_id=self.org_id, payload={"raw": raw_payload, "error": str(e)}, reason="Pipeline Crash"))
            self.db.commit()

    def _map_data(self, data):
        # Extremely simplified mock mapping
        data_str = json.dumps(data)
        needs_mapping = False
        
        # In a real system we'd traverse the AST. Here we just brute-force replace for the prototype.
        for local, std in MOCK_MAPPINGS["tests"].items():
            if local in data_str: data_str = data_str.replace(local, std["display"])
        
        # If there's an unknown local code, flag it
        if "UNKNOWN_LOCAL_CODE" in data_str:
            self.db.add(IntegrationQueue(queue_type="mapping_review", source_org_id=self.org_id, payload=data, reason="Unmapped terminology"))
            self.db.commit()
            raise ValueError("Unmapped terminology")
            
        return json.loads(data_str)

    def _validate(self, data):
        # Mock validation
        pass

    def _resolve_identity(self, source_mrn, demo):
        # 1. Exact ABHA
        if demo.get("abha"):
            p = self.db.query(Patient).filter(Patient.abha == demo["abha"]).first()
            if p:
                self.log_stage("IDENTITY", "success", {"match": "exact_abha"})
                return p.id
                
        # 2. Probabilistic Matching
        candidates = self.db.query(Patient).filter(Patient.phone == demo.get("phone")).all()
        best_score = 0
        best_match = None
        
        for p in candidates:
            score = difflib.SequenceMatcher(None, p.name.lower(), demo.get("name", "").lower()).ratio()
            # Age/DOB penalty
            if score > best_score:
                best_score = score
                best_match = p
                
        if best_score > 0.85:
            self.log_stage("IDENTITY", "success", {"match": "high_confidence", "score": best_score})
            return best_match.id
        elif best_score > 0.60:
            # Send to Identity Review Queue! (e.g. Rahul Verma vs Rahul Varma)
            self.log_stage("IDENTITY", "review_required", {"score": best_score})
            self.db.add(IntegrationQueue(
                queue_type="identity_review", 
                source_org_id=self.org_id, 
                payload={"source_mrn": source_mrn, "demographics": demo, "candidate_id": str(best_match.id)}, 
                reason=f"Ambiguous match score {best_score:.2f}"
            ))
            self.db.commit()
            return None
        else:
            # Create new
            self.log_stage("IDENTITY", "success", {"match": "new_patient"})
            new_p = Patient(
                name=demo.get("name", "Unknown"), 
                phone=demo.get("phone", "+910000000000"),
                dob=demo.get("dob")
            )
            self.db.add(new_p)
            self.db.commit()
            return new_p.id

    def _is_duplicate(self, patient_id, data):
        content_hash = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
        existing = self.db.query(Record).filter(
            Record.patient_id == patient_id, 
            Record.content_hash == content_hash
        ).first()
        return bool(existing)

    def _store(self, patient_id, data, source_mrn):
        content_hash = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
        rec = Record(
            patient_id=patient_id,
            type="report",
            fhir=data,
            source_name=self.org_id,
            source_type="connector",
            source_id=source_mrn,
            content_hash=content_hash,
            recorded_date=datetime.now(timezone.utc)
        )
        self.db.add(rec)
        self.db.commit()
