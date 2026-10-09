from abc import ABC, abstractmethod
from typing import Any, List
import uuid
from datetime import date

class RawRecord:
    def __init__(self, raw_data: Any, type: str, recorded_date: date):
        self.raw_data = raw_data
        self.type = type
        self.recorded_date = recorded_date

class Connector(ABC):
    @abstractmethod
    def fetch(self, patient_ref: str) -> List[RawRecord]:
        pass

    @abstractmethod
    def normalize(self, raw: RawRecord) -> dict:
        """Returns FHIR resource dict"""
        pass

class MockFHIRHospital(Connector):
    def fetch(self, patient_ref: str) -> List[RawRecord]:
        # Mocking a FHIR bundle fetch
        return [
            RawRecord(
                raw_data={
                    "resourceType": "Condition",
                    "code": {"text": "Hypertension"},
                    "subject": {"reference": f"Patient/{patient_ref}"}
                },
                type="condition",
                recorded_date=date.today()
            )
        ]

    def normalize(self, raw: RawRecord) -> dict:
        # Already FHIR-like
        return raw.raw_data

class MockLegacyClinic(Connector):
    def fetch(self, patient_ref: str) -> List[RawRecord]:
        # Mocking a CSV fetch: e.g., "date,diagnosis,notes\n2023-01-15,Type 2 Diabetes,..."
        return [
            RawRecord(
                raw_data={"date": "2023-01-15", "diagnosis": "Type 2 Diabetes", "rx": "Metformin 500mg"},
                type="condition",
                recorded_date=date(2023, 1, 15)
            ),
            RawRecord(
                raw_data={"date": "2023-01-15", "diagnosis": "Type 2 Diabetes", "rx": "Metformin 500mg"},
                type="medication",
                recorded_date=date(2023, 1, 15)
            )
        ]

    def normalize(self, raw: RawRecord) -> dict:
        if raw.type == "condition":
            return {
                "resourceType": "Condition",
                "code": {"text": raw.raw_data.get("diagnosis")}
            }
        elif raw.type == "medication":
            return {
                "resourceType": "MedicationStatement",
                "medicationCodeableConcept": {"text": raw.raw_data.get("rx")}
            }
        return {}

CONNECTORS = {
    "mock-fhir-hospital": MockFHIRHospital(),
    "mock-legacy-clinic": MockLegacyClinic()
}
