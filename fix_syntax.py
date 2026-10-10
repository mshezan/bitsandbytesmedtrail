with open("api/app/pipeline/engine.py", "r") as f:
    content = f.read()

import re

# Just grab everything from "def _resolve_identity" up to "def _is_duplicate"
# and replace the whole block cleanly.
identity_logic = """
    def _resolve_identity(self, source_mrn, demo):
        from app.models import User
        if not demo: return None
        if demo.get("abha"):
            p = self.db.query(Patient).filter(Patient.abha_number == demo["abha"]).first()
            if p:
                self.log_stage("IDENTITY", "success", {"match": "exact_abha"})
                return p.id
                
        candidates = self.db.query(Patient).join(User).filter(User.phone == demo.get("phone")).all()
        best_score = 0
        best_match = None
        
        for p in candidates:
            score = difflib.SequenceMatcher(None, p.user.name.lower(), demo.get("name", "").lower()).ratio()
            if score > best_score:
                best_score = score
                best_match = p
                
        if best_score > 0.85:
            self.log_stage("IDENTITY", "success", {"match": "high_confidence", "score": best_score})
            return best_match.id
        elif best_score > 0.60:
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
            self.log_stage("IDENTITY", "success", {"match": "new_patient_fallback"})
            fallback_p = self.db.query(Patient).first()
            if fallback_p: return fallback_p.id
            return None

    def _is_duplicate
"""

content = re.sub(r'    def _resolve_identity.*?    def _is_duplicate', identity_logic, content, flags=re.DOTALL)

with open("api/app/pipeline/engine.py", "w") as f:
    f.write(content)
