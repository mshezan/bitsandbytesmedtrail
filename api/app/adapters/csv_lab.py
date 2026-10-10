from typing import List, Dict, Any
from .base import Connector

class CSVLabConnector(Connector):
    def fetch(self) -> Any:
        pass

    def validate(self, raw_data: Any) -> bool:
        return isinstance(raw_data, str) and "patient_id" in raw_data.lower()

    def normalize(self, raw_data: Any) -> List[Dict[str, Any]]:
        # Dummy normalization converting CSV rows to FHIR Observations
        return [{"resourceType": "Observation", "status": "final", "code": {"text": "CSV Lab Data"}}]
