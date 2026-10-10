import os
import json
import logging
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
from pydantic import BaseModel, Field, ValidationError
from typing import List, Optional
import anthropic

log = logging.getLogger(__name__)

class ConditionSchema(BaseModel):
    name: str

class MedicationSchema(BaseModel):
    name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None

class ObservationSchema(BaseModel):
    name: str
    value: Optional[float] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    date: Optional[str] = None

class AllergySchema(BaseModel):
    substance: str
    reaction: Optional[str] = None

class ExtractedData(BaseModel):
    document_type: str
    provider: Optional[str] = None
    date: Optional[str] = None
    conditions: List[ConditionSchema] = []
    medications: List[MedicationSchema] = []
    observations: List[ObservationSchema] = []
    allergies: List[AllergySchema] = []
    confidence: float = 0.8

def extract_text_from_file(file_path: str, mime_type: str) -> str:
    text = ""
    if "pdf" in mime_type:
        pages = convert_from_path(file_path, first_page=1, last_page=10)
        for page in pages:
            text += pytesseract.image_to_string(page) + "\n"
    elif "image" in mime_type:
        text = pytesseract.image_to_string(Image.open(file_path))
    return text

def extract_with_llm(text: str) -> Optional[ExtractedData]:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
        
    client = anthropic.Anthropic(api_key=api_key)
    prompt = f"""
    Extract the following medical information from the text.
    Return ONLY valid JSON matching this schema:
    {{
      "document_type": "prescription|lab_report|discharge_summary|other",
      "provider": "string",
      "date": "YYYY-MM-DD",
      "conditions": [{{"name": "string"}}],
      "medications": [{{"name": "string", "dose": "string", "frequency": "string", "duration": "string"}}],
      "observations": [{{"name": "string", "value": number, "unit": "string", "reference_range": "string", "date": "string"}}],
      "allergies": [{{"substance": "string", "reaction": "string"}}],
      "confidence": 0.9
    }}
    Never invent values. Use null if unclear.
    
    Text:
    {text}
    """
    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        # Find JSON block in response
        response_text = response.content[0].text
        start = response_text.find("{")
        end = response_text.rfind("}")
        if start != -1 and end != -1:
            json_str = response_text[start:end+1]
            data = json.loads(json_str)
            return ExtractedData(**data)
    except Exception as e:
        log.error(f"LLM extraction failed: {e}")
    return None

def fallback_extract(text: str) -> ExtractedData:
    # A naive fallback using regex/keywords for demo purposes
    text_lower = text.lower()
    doc_type = "other"
    if "prescription" in text_lower or "rx" in text_lower:
        doc_type = "prescription"
    elif "lab" in text_lower or "test" in text_lower:
        doc_type = "lab_report"
        
    return ExtractedData(
        document_type=doc_type,
        provider="Extracted via Fallback OCR",
        confidence=0.4,
        conditions=[ConditionSchema(name="Extracted Condition")] if "diagnosis" in text_lower else []
    )

def process_file_extraction(file_path: str, mime_type: str) -> ExtractedData:
    text = extract_text_from_file(file_path, mime_type)
    data = extract_with_llm(text)
    if data:
        return data
    return fallback_extract(text)
