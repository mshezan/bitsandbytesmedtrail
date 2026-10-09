from datetime import date


def condition(name: str, onset: str, status: str = "active") -> dict:
    return {
        "resourceType": "Condition",
        "clinicalStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": status}]},
        "code": {"text": name},
        "onsetDateTime": onset,
    }


def medication(name: str, dose: str, start: str, status: str = "active") -> dict:
    return {
        "resourceType": "MedicationStatement",
        "status": status,
        "medicationCodeableConcept": {"text": name},
        "dosage": [{"text": dose}],
        "effectivePeriod": {"start": start},
    }


def observation(name: str, value: float, unit: str, when: str, ref: str | None = None) -> dict:
    resource = {
        "resourceType": "Observation",
        "status": "final",
        "code": {"text": name},
        "valueQuantity": {"value": value, "unit": unit},
        "effectiveDateTime": when,
    }
    if ref:
        resource["referenceRange"] = [{"text": ref}]
    return resource


def allergy(substance: str, reaction: str) -> dict:
    return {
        "resourceType": "AllergyIntolerance",
        "clinicalStatus": {"coding": [{"code": "active"}]},
        "code": {"text": substance},
        "reaction": [{"manifestation": [{"text": reaction}]}],
    }


def encounter(when: str, provider: str, reason: str, klass: str = "AMB") -> dict:
    return {
        "resourceType": "Encounter",
        "status": "finished",
        "class": {"code": klass},
        "reasonCode": [{"text": reason}],
        "period": {"start": when},
        "serviceProvider": {"display": provider},
    }


def report(title: str, when: str, conclusion: str) -> dict:
    return {
        "resourceType": "DiagnosticReport",
        "status": "final",
        "code": {"text": title},
        "effectiveDateTime": when,
        "conclusion": conclusion,
    }


def as_date(value: str) -> date:
    return date.fromisoformat(value[:10])
