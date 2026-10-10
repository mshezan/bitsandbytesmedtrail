from typing import List, Dict, Any
from .base import Connector

class FHIRConnector(Connector):
    def fetch(self) -> Any:
        # In a real scenario, this might pull from a FHIR server.
        # For our webhook, we receive the bundle directly.
        pass

    def validate(self, raw_data: Any) -> bool:
        if not isinstance(raw_data, dict):
            return False
        return raw_data.get("resourceType") == "Bundle"

    def normalize(self, raw_data: Any) -> List[Dict[str, Any]]:
        records = []
        entries = raw_data.get("entry", [])
        for entry in entries:
            res = entry.get("resource", {})
            if res.get("resourceType") in ["Observation", "Condition", "MedicationRequest", "Encounter"]:
                records.append(res)
        return records
