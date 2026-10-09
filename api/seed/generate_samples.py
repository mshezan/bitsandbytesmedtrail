"""Six synthetic clinical documents for upload testing. Not real patient data."""

from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

SAMPLES = Path(__file__).resolve().parent / "samples"


def _header(c: canvas.Canvas, clinic: str, title: str) -> None:
    c.setFont("Helvetica-Bold", 16)
    c.drawString(0.75 * inch, 10.4 * inch, clinic)
    c.setFont("Helvetica", 11)
    c.drawString(0.75 * inch, 10.15 * inch, title)
    c.line(0.75 * inch, 10.0 * inch, 7.75 * inch, 10.0 * inch)


def _write(c: canvas.Canvas, lines: list[str], y: float = 9.6) -> None:
    c.setFont("Helvetica", 11)
    for line in lines:
        c.drawString(0.75 * inch, y * inch, line)
        y -= 0.28


def write_pdf(name: str, clinic: str, title: str, lines: list[str]) -> Path:
    SAMPLES.mkdir(parents=True, exist_ok=True)
    path = SAMPLES / name
    c = canvas.Canvas(str(path), pagesize=letter)
    _header(c, clinic, title)
    _write(c, lines)
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(0.75 * inch, 0.5 * inch, "SYNTHETIC DEMO DOCUMENT — not a real medical record")
    c.save()
    return path


def generate_all() -> list[Path]:
    files = [
        write_pdf(
            "prescription_metformin.pdf",
            "Riverside Family Clinic",
            "Prescription",
            [
                "Patient: Priya Sharma (synthetic)",
                "Date: 2026-08-12",
                "Rx: Metformin 1000 mg",
                "Sig: 1 tablet by mouth twice daily",
                "Duration: 90 days",
                "Indication: Type 2 diabetes mellitus",
                "Prescriber: Dr. Elena Vasquez",
            ],
        ),
        write_pdf(
            "lab_hba1c.pdf",
            "City Diagnostics Lab",
            "Laboratory Report",
            [
                "Patient: Priya Sharma (synthetic)",
                "Date: 2026-09-01",
                "HbA1c: 7.4 %  (reference 4.0–5.6 %)",
                "Fasting glucose: 148 mg/dL  (70–99)",
                "Ordering clinician: Dr. Elena Vasquez",
            ],
        ),
        write_pdf(
            "discharge_summary.pdf",
            "Harbor General Hospital",
            "Discharge Summary",
            [
                "Patient: Mei Chen (synthetic)",
                "Admit: 2025-11-02   Discharge: 2025-11-05",
                "Diagnosis: Hypertensive urgency, hypothyroidism",
                "Hospital course: BP stabilized on amlodipine 5 mg daily.",
                "Levothyroxine 75 mcg daily continued.",
                "Follow up endocrinology in 2 weeks.",
            ],
        ),
        write_pdf(
            "prescription_amoxicillin.pdf",
            "Westside Urgent Care",
            "Prescription",
            [
                "Patient: James Okonkwo (synthetic)",
                "Date: 2026-09-20",
                "Rx: Amoxicillin 500 mg",
                "Sig: 1 capsule three times daily",
                "Duration: 7 days",
                "Indication: Acute sinusitis",
                "NOTE (chart): documented penicillin allergy",
            ],
        ),
        write_pdf(
            "lab_lipid.pdf",
            "Metro Heart Lab",
            "Lipid Panel",
            [
                "Patient: Priya Sharma (synthetic)",
                "Date: 2026-03-14",
                "Total cholesterol: 198 mg/dL",
                "LDL: 118 mg/dL",
                "HDL: 46 mg/dL",
                "Triglycerides: 170 mg/dL",
            ],
        ),
        write_pdf(
            "inhaler_prescription.pdf",
            "Lakeside Pulmonary",
            "Prescription",
            [
                "Patient: James Okonkwo (synthetic)",
                "Date: 2026-01-08",
                "Rx: Salbutamol 100 mcg inhaler",
                "Sig: 2 puffs as needed for wheeze",
                "Also: Fluticasone 110 mcg inhaler, 2 puffs twice daily",
                "Diagnosis: Persistent asthma",
            ],
        ),
    ]
    return files


if __name__ == "__main__":
    paths = generate_all()
    print(f"wrote {len(paths)} sample files")
