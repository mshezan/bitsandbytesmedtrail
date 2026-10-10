from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models import Record, MedicationInteraction, AllergyDrugMap


def _med_name(record: Record) -> str:
    concept = record.fhir.get("medicationCodeableConcept") or {}
    medication = record.fhir.get("medication", "Unknown")
    medication = medication.get("text", "Unknown") if isinstance(medication, dict) else medication
    return str(concept.get("text") if isinstance(concept, dict) and concept.get("text") else medication or "Unknown").strip()


def _record_name(record: Record) -> str:
    code = record.fhir.get("code") or {}
    name = code.get("text") if isinstance(code, dict) else code
    return str(name or record.fhir.get("observation") or "Unknown").strip()


def generate_insights(patient_id, db: Session):
    records = db.query(Record).filter(Record.patient_id == patient_id,
        Record.verified.is_(True), Record.status != "entered_in_error").all()
    insights = []
    medications = [r for r in records if r.type == "medication"]
    grouped = {}
    for record in medications:
        grouped.setdefault(_med_name(record).casefold(), []).append(record)
    for _, matches in grouped.items():
        sources = sorted({r.source_name for r in matches})
        doses = set()
        for r in matches:
            dosage = r.fhir.get("dosage") or r.fhir.get("dosageInstruction") or []
            if dosage:
                doses.add(dosage[0].get("text", "Unknown"))
        if len(matches) > 1 and (len(sources) > 1 or len(doses) > 1):
            insights.append({"title": f"Review prescription records: {_med_name(matches[0])}",
                             "description": f"Records differ across sources or doses ({', '.join(sources)}). Confirm the current prescription with your clinician.",
                             "severity": "medium", "record_ids": [str(r.id) for r in matches]})

    labs = [r for r in records if r.type == "observation"]
    by_test = {}
    for r in labs:
        by_test.setdefault(_record_name(r).casefold(), []).append(r)
    for _, matches in by_test.items():
        recent = [r for r in matches if r.recorded_date >= date.today() - timedelta(days=30)]
        if len(recent) > 1:
            insights.append({"title": f"Repeated test recorded: {_record_name(recent[0])}",
                             "description": f"This test appears {len(recent)} times in the last 30 days. Check prior results before ordering again.",
                             "severity": "low", "record_ids": [str(r.id) for r in recent]})

    allergies = [r for r in records if r.type == "allergy"]
    allergy_names = [(r.fhir.get("code", {}).get("text") or r.fhir.get("allergy", "")).casefold() for r in allergies]
    maps = db.query(AllergyDrugMap).all()
    for med in medications:
        name = _med_name(med).casefold()
        for allergy_map in maps:
            allergen = allergy_map.allergen.casefold()
            target = allergy_map.drug_or_class.casefold()
            if allergen in allergy_names and target in name:
                insights.append({"title": f"Check allergy against { _med_name(med) }",
                                 "description": f"A recorded {allergy_map.allergen} allergy may relate to this medication. Confirm with a clinician.",
                                 "severity": "high", "record_ids": [str(med.id)]})
                break

    interaction_rules = db.query(MedicationInteraction).all()
    names = [(_med_name(r).casefold(), r) for r in medications]
    for i, (name_a, record_a) in enumerate(names):
        for name_b, record_b in names[i + 1:]:
            for rule in interaction_rules:
                pair = {rule.drug_a.casefold(), rule.drug_b.casefold()}
                if pair.issubset({name_a, name_b}):
                    insights.append({"title": "Medication interaction rule match",
                                     "description": f"{rule.description} Review this combination with a clinician.",
                                     "severity": rule.severity.lower(),
                                     "record_ids": [str(record_a.id), str(record_b.id)]})
                    break
    return insights
