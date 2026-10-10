"""Idempotent demo seed. Synthetic patients only."""

from __future__ import annotations

import logging
import uuid
from datetime import date, timedelta
import random

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Organization, Staff
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
PATIENT_A_PHONE = "+919876543210"
PATIENT_B_PHONE = "+919876543211"
PATIENT_C_PHONE = "+919876543212"
PATIENT_D_PHONE = "+919876543213"
PATIENT_E_PHONE = "+919876543214"


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
    phone: str,
    name: str,
    email: str,
    dob: date,
    sex: str,
    blood_group: str,
    emergency: str,
    abha_number: str = None,
    abha_address: str = None,
    insurance: str = None,
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
        abha_number=abha_number,
        abha_address=abha_address,
        insurance=insurance,
    )
    db.add(patient)
    db.flush()
    return patient


def seed_orgs_and_staff(db: Session) -> None:
    if db.query(Organization).count() > 0:
        return
        
    orgs = [
        Organization(id=uuid.uuid4(), name="Kaveri Multispeciality Hospital", type="hospital", city="Chennai", state="Tamil Nadu", registration_no="HOSP-KAV-001"),
        Organization(id=uuid.uuid4(), name="Metro Diagnostics", type="lab", city="Bengaluru", state="Karnataka", registration_no="LAB-MET-002"),
        Organization(id=uuid.uuid4(), name="Sunrise Heart Institute", type="hospital", city="Hyderabad", state="Telangana", registration_no="HOSP-SUN-003"),
        Organization(id=uuid.uuid4(), name="Sanjeevani Clinic", type="clinic", city="Pune", state="Maharashtra", registration_no="CLIN-SAN-004"),
        Organization(id=uuid.uuid4(), name="MedPlus Pharmacy", type="pharmacy", city="Mumbai", state="Maharashtra", registration_no="PHAR-MED-005")
    ]
    db.add_all(orgs)
    db.flush()
    
    # Create Staff users
    staff_users = [
        User(id=uuid.uuid4(), role="hospital_staff", name="Dr. Ramesh Iyer", phone="+919876500001", email="ramesh.iyer@kaveri.local"),
        User(id=uuid.uuid4(), role="hospital_staff", name="Dr. Kavita Nair", phone="+919876500002", email="kavita.nair@sunrise.local"),
        User(id=uuid.uuid4(), role="hospital_staff", name="Dr. Harpreet Singh", phone="+919876500003", email="harpreet.singh@sanjeevani.local")
    ]
    db.add_all(staff_users)
    db.flush()
    
    # Link Staff to Orgs
    staff = [
        Staff(id=uuid.uuid4(), user_id=staff_users[0].id, org_id=orgs[0].id, role="doctor", designation="MD General Medicine", license_no="MCI-1001"),
        Staff(id=uuid.uuid4(), user_id=staff_users[1].id, org_id=orgs[2].id, role="doctor", designation="DM Cardiology", license_no="MCI-1002"),
        Staff(id=uuid.uuid4(), user_id=staff_users[2].id, org_id=orgs[3].id, role="doctor", designation="MBBS", license_no="MCI-1003")
    ]
    db.add_all(staff)
    db.commit()

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
    sources = ["Kaveri Multispeciality Hospital, Chennai", "Metro Diagnostics", "Sunrise Heart Institute, Hyderabad", "Sanjeevani Clinic", "MedPlus Pharmacy"]
    
    # Prescribers
    prescribers = ["Dr. Ramesh Iyer, MD General Medicine", "Dr. Kavita Nair, DM Cardiology", "Dr. Harpreet Singh, MBBS"]

    items.append(rec(p.id, "condition", condition("Type 2 diabetes mellitus", "2020-04-11"), sources[0], "2020-04-11"))
    items.append(rec(p.id, "condition", condition("Essential hypertension", "2021-08-03"), sources[2], "2021-08-03"))
    items.append(rec(p.id, "condition", condition("Fatty liver", "2022-01-15"), sources[3], "2022-01-15"))
    
    items.append(rec(p.id, "allergy", allergy("Penicillin", "Rash"), sources[3], "2015-06-10"))

    def med_with_prescriber(name, dose, date_str, prescriber):
        m = medication(name, dose, date_str)
        m["prescriber"] = prescriber
        return m

    items.append(rec(p.id, "medication", med_with_prescriber("Glycomet (Metformin)", "500 mg 1-0-1 after food", "2020-04-11", prescribers[0]), sources[0], "2020-04-11"))
    items.append(rec(p.id, "medication", med_with_prescriber("Telma (Telmisartan)", "40 mg 1-0-0", "2021-08-03", prescribers[1]), sources[2], "2021-08-03"))
    items.append(rec(p.id, "medication", med_with_prescriber("Atorva (Atorvastatin)", "10 mg 0-0-1", "2023-02-18", prescribers[0]), sources[0], "2023-02-18"))
    
    # Real conflict: Metformin 1000mg from another doctor
    items.append(rec(p.id, "medication", med_with_prescriber("Glycomet (Metformin)", "1000 mg 1-0-1 after food", "2023-05-12", prescribers[2]), sources[3], "2023-05-12"))
    # Allergy conflict
    items.append(rec(p.id, "medication", med_with_prescriber("Augmentin (Amoxicillin-Clavulanate)", "625 mg 1-0-1", "2023-06-01", prescribers[1]), sources[2], "2023-06-01"))

    base_date = date(2025, 1, 1)
    for i in range(18):
        d = base_date + timedelta(days=i*30)
        val = round(random.uniform(6.5, 8.5), 1)
        src = sources[1] if i % 2 == 0 else sources[0]
        items.append(rec(p.id, "observation", observation("HbA1c", val, "%", d.isoformat(), "4.0-5.6"), src, d.isoformat()))
        if i % 3 == 0:
            ldl_val = round(random.uniform(90, 150))
            items.append(rec(p.id, "observation", observation("LDL", ldl_val, "mg/dL", d.isoformat(), "<100"), src, d.isoformat()))
            items.append(rec(p.id, "observation", observation("Blood Pressure", "130/85", "mmHg", d.isoformat(), "<120/80"), src, d.isoformat()))
            items.append(rec(p.id, "observation", observation("Weight", 72, "kg", d.isoformat(), "60-80"), src, d.isoformat()))

    repeated_date = "2026-08-15"
    items.append(rec(p.id, "observation", observation("Serum Creatinine", 1.1, "mg/dL", repeated_date, "0.7-1.3"), sources[0], repeated_date))
    items.append(rec(p.id, "observation", observation("Serum Creatinine", 1.2, "mg/dL", repeated_date, "0.7-1.3"), sources[2], repeated_date))

    items.append(rec(p.id, "encounter", encounter("2020-01-10", sources[4], "Initial Consultation"), sources[4], "2020-01-10"))

    recent_dates = [(date(2026, 10, i)).isoformat() for i in range(1, 7)]
    for idx, rd in enumerate(recent_dates):
        items.append(rec(p.id, "encounter", encounter(rd, sources[0], f"Routine Checkup {idx+1}"), sources[0], rd))

    items.append(rec(p.id, "report", report("Previous Hospital Records", "2026-09-01", "Uploaded raw records"), "Self Upload", "2026-09-01", source_type="upload", verified=False))
    items.append(rec(p.id, "report", report("Pending Blood Test Report", "2026-10-05", "Pending OCR processing"), "Self Upload", "2026-10-05", source_type="upload", verified=False))

    db.add_all(items)

def seed_patient_b(db: Session, p: Patient) -> None:
    if db.query(Record).filter(Record.patient_id == p.id).count():
        return
    items = [
        rec(p.id, "condition", condition("Persistent asthma", "2016-05-20"), "Sanjeevani Clinic", "2016-05-20"),
        rec(p.id, "condition", condition("History of Dengue", "2018-09-10"), "Sanjeevani Clinic", "2018-09-10"),
        rec(p.id, "allergy", allergy("Penicillin", "Anaphylaxis"), "Sanjeevani Clinic", "2016-05-20"),
        rec(p.id, "medication", medication("Asthalin (Salbutamol)", "100 mcg, 2 puffs as needed", "2016-05-20"), "Sanjeevani Clinic", "2016-05-20"),
    ]
    db.add_all(items)

def seed_patient_c(db: Session, p: Patient) -> None:
    if db.query(Record).filter(Record.patient_id == p.id).count():
        return
    items = [
        rec(p.id, "condition", condition("Hypothyroidism", "2020-01-15"), "Kaveri Multispeciality Hospital, Chennai", "2020-01-15"),
        rec(p.id, "condition", condition("Vitamin D Deficiency", "2020-01-15"), "Kaveri Multispeciality Hospital, Chennai", "2020-01-15"),
        rec(p.id, "medication", medication("Thyronorm (Levothyroxine)", "75 mcg 1-0-0 before food", "2020-01-15"), "Kaveri Multispeciality Hospital, Chennai", "2020-01-15"),
    ]
    db.add_all(items)

def seed_patient_d(db: Session, p: Patient) -> None:
    if db.query(Record).filter(Record.patient_id == p.id).count():
        return
    items = [
        rec(p.id, "condition", condition("Chronic kidney disease stage 3", "2021-09-30"), "Sunrise Heart Institute, Hyderabad", "2021-09-30"),
        rec(p.id, "condition", condition("Coronary Artery Disease", "2021-09-30"), "Sunrise Heart Institute, Hyderabad", "2021-09-30"),
        rec(p.id, "medication", medication("Ecosprin (Aspirin)", "75 mg 0-1-0", "2021-09-30"), "Sunrise Heart Institute, Hyderabad", "2021-09-30"),
    ]
    db.add_all(items)

def seed_patient_e(db: Session, p: Patient) -> None:
    if db.query(Record).filter(Record.patient_id == p.id).count():
        return
    items = [
        rec(p.id, "condition", condition("PCOS", "2019-04-01"), "Sanjeevani Clinic", "2019-04-01"),
        rec(p.id, "condition", condition("Anemia (Iron deficiency)", "2019-04-01"), "Metro Diagnostics", "2019-04-01"),
        rec(p.id, "medication", medication("Pan 40 (Pantoprazole)", "40 mg 1-0-0 empty stomach", "2019-04-01"), "Sanjeevani Clinic", "2019-04-01"),
    ]
    db.add_all(items)

def run() -> None:
    generate_all()
    db = SessionLocal()
    try:
        seed_orgs_and_staff(db)
        seed_rules(db)
        a = ensure_user_patient(
            db,
            phone=PATIENT_A_PHONE,
            name="Priya Sharma",
            email="priya.demo@medtrail.local",
            dob=date(1974, 2, 19),
            sex="female",
            blood_group="B+",
            emergency="Ramesh Sharma +91-9876543299",
            abha_number="91-4821-3921-1122",
            abha_address="priyasharma@abdm",
            insurance="Ayushman Bharat PM-JAY"
        )
        b = ensure_user_patient(
            db,
            phone=PATIENT_B_PHONE,
            name="Ramesh Iyer",
            email="ramesh.demo@medtrail.local",
            dob=date(1992, 7, 4),
            sex="male",
            blood_group="O+",
            emergency="Anjali Iyer +91-9876543288",
            abha_number="91-1122-3344-5566",
            abha_address="rameshiyer@abdm",
            insurance="CGHS"
        )
        c = ensure_user_patient(
            db,
            phone=PATIENT_C_PHONE,
            name="Fatima Khan",
            email="fatima.demo@medtrail.local",
            dob=date(1968, 11, 23),
            sex="female",
            blood_group="A-",
            emergency="Mohammed Khan +91-9876543277",
            abha_number="91-9988-7766-5544",
            abha_address="fatimakhan@abdm",
            insurance="ESI"
        )
        d = ensure_user_patient(
            db,
            phone=PATIENT_D_PHONE,
            name="Arjun Reddy",
            email="arjun.demo@medtrail.local",
            dob=date(1961, 5, 8),
            sex="male",
            blood_group="AB+",
            emergency="Kavita Reddy +91-9876543266",
            abha_number="91-2233-4455-6677",
            abha_address="arjunreddy@abdm",
            insurance="Star Health Insurance"
        )
        e = ensure_user_patient(
            db,
            phone=PATIENT_E_PHONE,
            name="Kavita Nair",
            email="kavita.demo@medtrail.local",
            dob=date(2003, 9, 30),
            sex="female",
            blood_group="O-",
            emergency="Sunil Nair +91-9876543255",
            abha_number="91-7788-9900-1122",
            abha_address="kavitanair@abdm",
            insurance="HDFC ERGO"
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

