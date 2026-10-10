from sqlalchemy.orm import Session
from app.models import Record

def generate_insights(patient_id: str, db: Session):
    records = db.query(Record).filter(Record.patient_id == patient_id).all()
    insights = []
    
    # 1. Therapeutic Duplication / Dose Mismatch
    meds = [r for r in records if r.type == "medication"]
    med_names = {}
    for m in meds:
        name = m.fhir.get("medication", m.fhir.get("code", {}).get("text", "Unknown"))
        if name not in med_names:
            med_names[name] = []
        med_names[name].append(m)
        
    for name, matches in med_names.items():
        if len(matches) > 1:
            sources = list(set([m.source_name for m in matches]))
            if len(sources) > 1:
                insights.append({
                    "title": f"Duplicate Prescription: {name}",
                    "description": f"Prescribed by multiple sources: {', '.join(sources)}. Please verify dosage.",
                    "severity": "high"
                })
                
    # 2. Repeated Labs
    labs = [r for r in records if r.type == "observation"]
    lab_names = {}
    for l in labs:
        name = l.fhir.get("observation", l.fhir.get("code", {}).get("text", "Unknown"))
        if name not in lab_names:
            lab_names[name] = []
        lab_names[name].append(l)
        
    for name, matches in lab_names.items():
        if len(matches) > 1:
            insights.append({
                "title": f"Repeated Test: {name}",
                "description": f"This test was performed {len(matches)} times recently across different providers.",
                "severity": "medium"
            })
            
    # Mocking a drug interaction if there are multiple meds
    if len(med_names) >= 2:
        names = list(med_names.keys())
        insights.append({
            "title": f"Drug Interaction Warning",
            "description": f"Potential interaction between {names[0]} and {names[1]}.",
            "severity": "high"
        })
        
    return insights
