from typing import List, Dict, Any
from datetime import date
from app.models import Record, ObservationWindow, MedicationInteraction, AllergyDrugMap
from sqlalchemy.orm import Session

def generate_insights(patient_id: str, db: Session) -> List[Dict[str, Any]]:
    insights = []
    
    # Fetch verified records
    records = db.query(Record).filter(
        Record.patient_id == patient_id,
        Record.verified == True
    ).order_by(Record.recorded_date.desc()).all()
    
    observations = [r for r in records if r.type == "observation"]
    medications = [r for r in records if r.type == "medication"]
    allergies = [r for r in records if r.type == "allergy"]
    
    # 1. Repeated Tests
    windows = {w.observation_name.lower(): w.window_days for w in db.query(ObservationWindow).all()}
    seen_obs = {}
    for obs in observations:
        name = obs.fhir.get("code", {}).get("text", "")
        name_lower = name.lower()
        if not name_lower:
            continue
            
        if name_lower in windows:
            # If we've seen a more recent one
            if name_lower in seen_obs:
                recent = seen_obs[name_lower]
                delta = (recent.recorded_date - obs.recorded_date).days
                # Wait, they are sorted descending. So 'obs' is older than 'recent'.
                # Actually, the insight should trigger if a NEW test is requested, but for now we look at existing data:
                # If there are two tests within the window, flag it as redundant.
                if delta <= windows[name_lower]:
                    val = recent.fhir.get("valueQuantity", {})
                    val_str = f"{val.get('value', '')} {val.get('unit', '')}"
                    insights.append({
                        "type": "repeated_test",
                        "severity": "info",
                        "title": f"Repeated {name} test",
                        "description": f"Done {(date.today() - recent.recorded_date).days} days ago at {recent.source_name}, result {val_str}. Repeat may be unnecessary.",
                        "source_records": [str(recent.id), str(obs.id)]
                    })
                    # Avoid flagging the same pair multiple times
                    seen_obs.pop(name_lower, None)
            else:
                seen_obs[name_lower] = obs

    # 2. Medicine interactions
    active_meds = [m.fhir.get("medicationCodeableConcept", {}).get("text", "").lower() for m in medications]
    interactions = db.query(MedicationInteraction).all()
    
    for interaction in interactions:
        a_present = any(interaction.drug_a.lower() in m for m in active_meds)
        b_present = any(interaction.drug_b.lower() in m for m in active_meds)
        if a_present and b_present:
            insights.append({
                "type": "interaction",
                "severity": interaction.severity,
                "title": f"Drug Interaction: {interaction.drug_a} + {interaction.drug_b}",
                "description": interaction.description,
                "source_records": [] # We could match exact IDs but simplified for MVP
            })

    # 3. Allergy conflicts
    active_allergens = [a.fhir.get("code", {}).get("text", "").lower() for a in allergies]
    allergy_maps = db.query(AllergyDrugMap).all()
    
    for med in active_meds:
        for a_map in allergy_maps:
            if a_map.drug_or_class.lower() in med:
                # check if patient has the allergy
                if any(a_map.allergen.lower() in allergen for allergen in active_allergens):
                    insights.append({
                        "type": "allergy_conflict",
                        "severity": "critical",
                        "title": f"Allergy Conflict: {a_map.drug_or_class}",
                        "description": f"Active medication contains {a_map.drug_or_class} but patient has recorded allergy to {a_map.allergen}.",
                        "source_records": []
                    })
                    
    return insights
