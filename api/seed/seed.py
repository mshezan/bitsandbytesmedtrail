"""Idempotent demo seed. Synthetic patients only."""

from __future__ import annotations

import logging
import uuid
from datetime import date, timedelta
import random

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import (
    AllergyDrugMap,
    MedicationInteraction,
    ObservationWindow,
    OverdueTestRule,
    Patient,
    Record,
    User,
    UserRole,
)
from seed.fhir import allergy, as_date, condition, encounter, medication, observation, report
from seed.generate_samples import generate_all
from seed.rules import ALLERGY_MAP, INTERACTION_RULES, OBSERVATION_WINDOWS

log = logging.getLogger(__name__)

# Demo logins (OTP is always 123456 in demo mode)
PATIENT_A_PHONE = "5550101"
PATIENT_B_PHONE = "5550102"
PATIENT_C_PHONE = "5550103"
PATIENT_D_PHONE = "5550104"
PATIENT_E_PHONE = "5550105"


def rec(
    patient_id: uuid.UUID,
    rtype: str,
    fhir: dict,
    source_name: str,
    recorded: str,
    source_type: str = "seed",
    *,
    verified: bool = True,
    confidence: float = 1.0,
) -> Record:
    return Record(
        id=uuid.uuid4(),
        patient_id=patient_id,
        type=rtype,
        fhir=fhir,
        source_name=source_name,
        source_type=source_type,
        recorded_date=as_date(recorded),
        confidence=confidence,
        verified=verified,
    )


def ensure_user_patient(
    db: Session,
    *,
    phone: str,
    name: str,
    email: str,
    dob: date,
    sex: str,
    blood_group: str,
    emergency: str,
) -> Patient:
    user = db.query(User).filter(User.phone == phone).one_or_none()
    if user and user.patient:
        return user.patient
    if user is None:
        user = User(
            id=uuid.uuid4(),
            role=UserRole.patient,
            name=name,
            phone=phone,
            email=email,
        )
        db.add(user)
        db.flush()
    patient = Patient(
        id=uuid.uuid4(),
        user_id=user.id,
        dob=dob,
        sex=sex,
        blood_group=blood_group,
        emergency_contact=emergency,
    )
    db.add(patient)
    db.flush()
    return patient


def seed_rules(db: Session) -> None:
    if db.query(ObservationWindow).count() == 0:
        for name, days in OBSERVATION_WINDOWS:
            db.add(ObservationWindow(id=uuid.uuid4(), observation_name=name, window_days=days))
    if db.query(MedicationInteraction).count() == 0:
        for a, b, sev, desc in INTERACTION_RULES:
            db.add(
                MedicationInteraction(
                    id=uuid.uuid4(),
                    drug_a=a,
                    drug_b=b,
                    severity=sev,
                    description=desc,
                )
            )
    if db.query(AllergyDrugMap).count() == 0:
        for allergen, drug in ALLERGY_MAP:
            db.add(AllergyDrugMap(id=uuid.uuid4(), allergen=allergen, drug_or_class=drug))
            
    if db.query(OverdueTestRule).count() == 0:
        db.add(OverdueTestRule(id=uuid.uuid4(), test_name="HbA1c", condition_trigger="Type 2 diabetes mellitus", interval_days=90))
        db.add(OverdueTestRule(id=uuid.uuid4(), test_name="Lipid Profile", condition_trigger="Essential hypertension", interval_days=180))


def seed_patient_a(db: Session, p: Patient) -> None:
    """Diabetes + hypertension; massive data for widgets."""
    if db.query(Record).filter(Record.patient_id == p.id).count():
        return
    items = []
    
    # 5 Sources
    sources = ["Apollo Hospitals", "Dr. Lal PathLabs", "Max Healthcare", "Fortis Hospital", "Manipal Hospital"]
    
    # 3 Prescribers
    prescribers = ["Dr. Sharma", "Dr. Gupta", "Dr. Reddy"]

    # Conditions
    items.append(rec(p.id, "condition", condition("Type 2 diabetes mellitus", "2020-04-11"), sources[0], "2020-04-11"))
    items.append(rec(p.id, "condition", condition("Essential hypertension", "2021-08-03"), sources[2], "2021-08-03"))
    
    # Allergy
    items.append(rec(p.id, "allergy", allergy("Penicillin", "Rash"), sources[3], "2015-06-10"))

    # Medications (Realistic Indian medicines) with prescriber
    def med_with_prescriber(name, dose, date_str, prescriber):
        m = medication(name, dose, date_str)
        m["prescriber"] = prescriber
        return m

    items.append(rec(p.id, "medication", med_with_prescriber("Glycomet (Metformin)", "500 mg twice daily", "2020-04-11", prescribers[0]), sources[0], "2020-04-11"))
    items.append(rec(p.id, "medication", med_with_prescriber("Telma (Telmisartan)", "40 mg daily", "2021-08-03", prescribers[1]), sources[2], "2021-08-03"))
    items.append(rec(p.id, "medication", med_with_prescriber("Rosuvas (Rosuvastatin)", "10 mg at night", "2023-02-18", prescribers[0]), sources[0], "2023-02-18"))
    
    # Real conflict: Metformin 1000mg from another doctor
    items.append(rec(p.id, "medication", med_with_prescriber("Glycomet (Metformin)", "1000 mg once daily", "2023-05-12", prescribers[2]), sources[3], "2023-05-12"))

    # Allergy conflict
    items.append(rec(p.id, "medication", med_with_prescriber("Amoxicillin (Penicillin class)", "500 mg thrice daily", "2023-06-01", prescribers[1]), sources[2], "2023-06-01"))

    # 18 months of labs across providers
    base_date = date(2025, 1, 1) # Start around beginning of 2025
    for i in range(18):
        d = base_date + timedelta(days=i*30)
        val = round(random.uniform(6.5, 8.5), 1)
        src = sources[1] if i % 2 == 0 else sources[4] # switch providers
        items.append(rec(p.id, "observation", observation("HbA1c", val, "%", d.isoformat(), "4.0-5.6"), src, d.isoformat()))
        if i % 3 == 0:
            ldl_val = round(random.uniform(90, 150))
            items.append(rec(p.id, "observation", observation("LDL", ldl_val, "mg/dL", d.isoformat(), "<100"), src, d.isoformat()))

    # One repeated test (done on the same day by different providers)
    repeated_date = "2026-08-15"
    items.append(rec(p.id, "observation", observation("Serum Creatinine", 1.1, "mg/dL", repeated_date, "0.7-1.3"), sources[0], repeated_date))
    items.append(rec(p.id, "observation", observation("Serum Creatinine", 1.2, "mg/dL", repeated_date, "0.7-1.3"), sources[2], repeated_date))

    # Gap (e.g., source with very old last visit)
    items.append(rec(p.id, "encounter", encounter("2020-01-10", sources[4], "Initial Consultation"), sources[4], "2020-01-10"))

    # 6 Recent activity items
    recent_dates = [(date(2026, 10, i)).isoformat() for i in range(1, 7)]
    for idx, rd in enumerate(recent_dates):
        items.append(rec(p.id, "encounter", encounter(rd, sources[0], f"Routine Checkup {idx+1}"), sources[0], rd))

    # 2 Unverified uploads
    items.append(rec(p.id, "report", report("Previous Hospital Records", "2026-09-01", "Uploaded raw records"), "Self Upload", "2026-09-01", source_type="upload", verified=False))
    items.append(rec(p.id, "report", report("Pending Blood Test Report", "2026-10-05", "Pending OCR processing"), "Self Upload", "2026-10-05", source_type="upload", verified=False))

    db.add_all(items)



def seed_patient_b(db: Session, p: Patient) -> None:
    if db.query(Record).filter(Record.patient_id == p.id).count():
        return
    items = [
        rec(p.id, "condition", condition("Persistent asthma", "2016-05-20"), "Fortis Hospital", "2016-05-20"),
        rec(p.id, "allergy", allergy("Penicillin", "Anaphylaxis"), "Fortis Hospital", "2016-05-20"),
        rec(p.id, "medication", medication("Asthalin (Salbutamol)", "100 mcg, 2 puffs as needed", "2016-05-20"), "Fortis Hospital", "2016-05-20"),
    ]
    db.add_all(items)


def seed_patient_c(db: Session, p: Patient) -> None:
    if db.query(Record).filter(Record.patient_id == p.id).count():
        return
    items = [
        rec(p.id, "condition", condition("Hypothyroidism", "2020-01-15"), "Manipal Hospital", "2020-01-15"),
        rec(p.id, "medication", medication("Thyronorm (Levothyroxine)", "75 mcg daily", "2020-01-15"), "Manipal Hospital", "2020-01-15"),
    ]
    db.add_all(items)


def seed_patient_d(db: Session, p: Patient) -> None:
    if db.query(Record).filter(Record.patient_id == p.id).count():
        return
    items = [
        rec(p.id, "condition", condition("Chronic kidney disease stage 3", "2021-09-30"), "Narayana Health", "2021-09-30"),
    ]
    db.add_all(items)


def seed_patient_e(db: Session, p: Patient) -> None:
    if db.query(Record).filter(Record.patient_id == p.id).count():
        return
    items = [
        rec(p.id, "condition", condition("Seasonal allergic rhinitis", "2019-04-01"), "Cloudnine Hospital", "2019-04-01"),
    ]
    db.add_all(items)


def run() -> None:
    generate_all()
    db = SessionLocal()
    try:
        seed_rules(db)
        a = ensure_user_patient(
            db,
            phone=PATIENT_A_PHONE,
            name="Rahul Sharma",
            email="rahul.demo@medtrail.local",
            dob=date(1974, 2, 19),
            sex="male",
            blood_group="B+",
            emergency="Priya Sharma +91-9876543210",
        )
        b = ensure_user_patient(
            db,
            phone=PATIENT_B_PHONE,
            name="Vikram Singh",
            email="vikram.demo@medtrail.local",
            dob=date(1992, 7, 4),
            sex="male",
            blood_group="O+",
            emergency="Anjali Singh +91-9876543211",
        )
        c = ensure_user_patient(
            db,
            phone=PATIENT_C_PHONE,
            name="Neha Gupta",
            email="neha.demo@medtrail.local",
            dob=date(1968, 11, 23),
            sex="female",
            blood_group="A-",
            emergency="Rajesh Gupta +91-9876543212",
        )
        d = ensure_user_patient(
            db,
            phone=PATIENT_D_PHONE,
            name="Sneha Reddy",
            email="sneha.demo@medtrail.local",
            dob=date(1961, 5, 8),
            sex="female",
            blood_group="AB+",
            emergency="Arjun Reddy +91-9876543213",
        )
        e = ensure_user_patient(
            db,
            phone=PATIENT_E_PHONE,
            name="Arun Patel",
            email="arun.demo@medtrail.local",
            dob=date(2003, 9, 30),
            sex="male",
            blood_group="O-",
            emergency="Kavita Patel +91-9876543214",
        )
        seed_patient_a(db, a)
        seed_patient_b(db, b)
        seed_patient_c(db, c)
        seed_patient_d(db, d)
        seed_patient_e(db, e)
        db.commit()
        n = db.query(Record).count()
        log.info("seed_complete patients=%s records=%s", 5, n)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
