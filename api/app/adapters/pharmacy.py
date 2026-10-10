from typing import List, Dict, Any
from .base import Connector

class PharmacyConnector(Connector):
    def fetch(self) -> Any:
        pass

    def validate(self, raw_data: Any) -> bool:
        return isinstance(raw_data, dict) and "prescriptions" in raw_data

    def normalize(self, raw_data: Any) -> List[Dict[str, Any]]:
        # Dummy normalization
        return [{"resourceType": "MedicationRequest", "status": "active"}]
