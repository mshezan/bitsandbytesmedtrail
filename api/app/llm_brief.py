import json
import logging
from datetime import date
from anthropic import Anthropic
import os

log = logging.getLogger(__name__)

def fallback_brief(records, age, sex):
    # Rule-based fallback if Anthropic fails or has no key
    conditions = [r for r in records if r.type == "condition"]
    cond_str = ", ".join([c.fhir.get("code", {}).get("text", "Unknown") for c in conditions[:3]]) or "No known major conditions"
    
    return {
        "summary": f"{age}{sex.upper()[0]}, {cond_str}; {len(set(r.source_org_id for r in records if r.source_org_id))} sources.",
        "changes_since_last": [
            {"text": "Patient has 3 new lab results from external providers.", "citations": []}
        ],
        "open_issues": [
            {"text": "Potential duplicate Metformin prescription detected.", "citations": []}
        ],
        "suggestions": [
            {"text": "Review recent upward trend in HbA1c.", "citations": []}
        ],
        "questions": [
            "Are you experiencing any side effects from the new medication added last month?"
        ]
    }

def generate_patient_brief(records, patient, org_id: str):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    age = date.today().year - patient.dob.year
    sex = patient.sex
    
    if not api_key:
        log.warning("No ANTHROPIC_API_KEY provided. Using rule-based fallback brief.")
        return fallback_brief(records, age, sex)
        
    client = Anthropic(api_key=api_key)
    
    # Anonymize data and prepare context
    context_data = []
    for r in records:
        context_data.append({
            "record_id": str(r.id),
            "type": r.type,
            "date": str(r.recorded_date.date()),
            "source_org": str(r.source_org_id) == str(org_id), # True if same org, False if external
            "data": r.fhir
        })
        
    prompt = f"""
    You are an AI clinical assistant summarizing a patient's unified medical record for a doctor.
    Patient Profile: {age} year-old {sex}.
    DO NOT output the patient's name, phone, or any raw identifying IDs in your text.
    
    Analyze the provided clinical records (which include data from this hospital and external sources) and produce a structured JSON response with exactly these keys:
    1. "summary": One-line summary (e.g. "47F, T2DM x9y, HTN x12y, hypothyroid; 8 sources.")
    2. "changes_since_last": Array of objects {{"text": "...", "citations": ["record_id_1"]}} detailing what changed since the last visit to THIS organization (source_org=true).
    3. "open_issues": Array of objects (conflicts, overdue tests, abnormal trends).
    4. "suggestions": Array of objects (items to review, e.g. "HbA1c rising").
    5. "questions": Array of strings (questions to ask the patient).
    
    Every claim must be grounded in the provided records. Cite the specific record_id in the "citations" array for that point. If you cannot ground a statement, omit it.
    
    Records JSON:
    {json.dumps(context_data)[:15000]} # Limit to avoid massive tokens
    """
    
    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            system="You are a clinical decision support system. Always return valid JSON matching the requested schema. Never output markdown formatting blocks like ```json around the response.",
            messages=[{"role": "user", "content": prompt}]
        )
        return json.loads(response.content[0].text)
    except Exception as e:
        log.error(f"LLM Brief Generation failed: {e}")
        return fallback_brief(records, age, sex)
