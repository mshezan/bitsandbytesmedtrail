import argparse
import sys
import uuid
import random
from datetime import date, timedelta, datetime

from app.database import SessionLocal, engine
from app import models


def ensure_hero_history(db):
    """Add/repair the synthetic multi-provider history for the demo patient."""
    patient_user = db.query(models.User).filter(models.User.phone == "+919876543210").first()
    if not patient_user:
        return
    patient = db.query(models.Patient).filter(models.Patient.user_id == patient_user.id).first()
    if not patient:
        return
    # Replace numbered placeholder labels with stable synthetic demo identities.
    demo_names = ["Priya Sharma", "Rahul Verma", "Anita Desai", "Vikram Singh", "Aarav Patel",
                  "Meera Nair", "Arjun Reddy", "Kavita Iyer", "Sanjay Menon", "Nisha Kapoor",
                  "Rohan Kulkarni", "Pooja Shah", "Aditya Joshi", "Lakshmi Rao", "Karan Malhotra",
                  "Divya Krishnan", "Manish Gupta", "Sneha Banerjee", "Arvind Pillai", "Neha Chatterjee"]
    for user in db.query(models.User).filter(models.User.role == "patient").all():
        if user.name.startswith("Patient ") and user.phone.startswith("+91987654"):
            try:
                index = int(user.phone[len("+91987654"):])
            except ValueError:
                continue
            user.name = demo_names[index] if index < len(demo_names) else f"Demo Patient {index:03d}"
    # Keep the two demo accounts used in walkthroughs stable and clinically coherent.
    first_user = db.query(models.User).filter(models.User.phone == "+919876543210").first()
    second_user = db.query(models.User).filter(models.User.phone == "+919876543211").first()
    if first_user:
        first_user.name = "Priya Sharma"
    if second_user:
        second_user.name = "Rahul Verma"
        second_patient = db.query(models.Patient).filter(models.Patient.user_id == second_user.id).first()
        if second_patient:
            second_patient.sex = "male"
    catalog = [
        ("Kaveri Hospitals", "hospital", "HOSP-KAV-001"),
        ("Metro Diagnostics", "laboratory", "LAB-MET-002"),
        ("ClearView Eye Centre", "clinic", "CLIN-EYE-003"),
        ("Pearl Dental Care", "clinic", "CLIN-DEN-004"),
        ("CareFirst Pharmacy", "pharmacy", "PHARM-CF-005"),
        ("Sanjeevani Family Clinic", "clinic", "CLIN-SAN-006"),
        ("Sunrise Heart & General Hospital", "hospital", "HOSP-SUN-007"),
        ("Apex Imaging", "imaging", "IMG-APX-008"),
        ("Lotus Women & Wellness", "clinic", "CLIN-LOT-009"),
    ]
    organizations = {}
    for index, (name, org_type, code) in enumerate(catalog):
        org = db.query(models.Organization).filter(models.Organization.registration_no == code).first()
        if not org:
            org = db.query(models.Organization).filter(models.Organization.name == name).first()
        if not org:
            org = db.query(models.Organization).filter(models.Organization.name == f"Hospital {index}").first()
        if not org:
            org = models.Organization(id=uuid.uuid4(), name=name, type=org_type, registration_no=code)
            db.add(org)
            db.flush()
        else:
            org.name, org.type, org.registration_no = name, org_type, code
        organizations[index] = org

    # Older demo databases have placeholder staff names even though the UI treats
    # them as real clinicians. Normalize the existing rows without changing logins.
    clinician_names = ["Dr. Meera Rao", "Dr. Arjun Menon", "Dr. Ananya Iyer", "Dr. Kabir Shah",
                       "Dr. Nisha Kapoor", "Dr. Rohan Kulkarni", "Dr. Pooja Nair", "Dr. Vikram Desai",
                       "Dr. Sana Khan", "Dr. Dev Patel"]
    for staff_user in db.query(models.User).filter(models.User.role == "hospital_staff").all():
        if staff_user.email == "ramesh.iyer@kaveri.local":
            staff_user.name = "Dr. Meera Rao"
        elif staff_user.email and staff_user.email.startswith("staff") and staff_user.email.endswith("@hospital.local"):
            try:
                staff_index = int(staff_user.email[5:].split("@", 1)[0])
            except ValueError:
                continue
            staff_user.name = clinician_names[staff_index] if staff_index < len(clinician_names) else f"Dr. Clinician {staff_index:02d}"

    # Retire the old placeholder entries that rendered as hundreds of blank labs.
    db.query(models.Record).filter(models.Record.patient_id == patient.id,
        models.Record.source_type == "seed", models.Record.fhir == {}).delete(synchronize_session=False)
    today = date.today()
    samples = [
        (0, "condition", {"resourceType":"Condition", "code":{"text":"Type 2 diabetes mellitus"}, "clinicalStatus":{"text":"Active"}}, 420),
        (0, "condition", {"resourceType":"Condition", "code":{"text":"Essential hypertension"}, "clinicalStatus":{"text":"Active"}}, 390),
        (0, "allergy", {"resourceType":"AllergyIntolerance", "code":{"text":"Penicillin"}, "reaction":[{"manifestation":[{"text":"Rash"}]}]}, 500),
        (0, "medication", {"resourceType":"MedicationRequest", "status":"active", "medicationCodeableConcept":{"text":"Metformin 500 mg"}, "dosage":[{"text":"1 tablet twice daily with meals"}], "prescriber":"Dr. Meera Rao"}, 45),
        (0, "medication", {"resourceType":"MedicationRequest", "status":"active", "medicationCodeableConcept":{"text":"Amlodipine 5 mg"}, "dosage":[{"text":"1 tablet once daily"}], "prescriber":"Dr. Meera Rao"}, 45),
        (1, "observation", {"resourceType":"Observation", "code":{"text":"HbA1c"}, "valueQuantity":{"value":7.2,"unit":"%"}}, 60),
        (1, "observation", {"resourceType":"Observation", "code":{"text":"Fasting blood glucose"}, "valueQuantity":{"value":132,"unit":"mg/dL"}}, 60),
        (1, "observation", {"resourceType":"Observation", "code":{"text":"TSH"}, "valueQuantity":{"value":2.8,"unit":"mIU/L"}}, 180),
        (2, "encounter", {"resourceType":"Encounter", "type":[{"text":"Comprehensive eye examination"}], "reasonCode":[{"text":"Diabetes eye screening"}], "status":"finished"}, 125),
        (2, "report", {"resourceType":"DiagnosticReport", "code":{"text":"Retinal screening"}, "conclusion":"No diabetic retinopathy detected; annual review advised."}, 125),
        (3, "encounter", {"resourceType":"Encounter", "type":[{"text":"Dental examination and cleaning"}], "reasonCode":[{"text":"Routine preventive dental visit"}], "status":"finished"}, 210),
        (3, "condition", {"resourceType":"Condition", "code":{"text":"Dental caries, tooth 16"}, "clinicalStatus":{"text":"Resolved"}}, 210),
        (4, "medication", {"resourceType":"MedicationRequest", "status":"completed", "medicationCodeableConcept":{"text":"Cholecalciferol 60,000 IU"}, "dosage":[{"text":"Once weekly for 8 weeks"}], "prescriber":"CareFirst Pharmacy · dispensed"}, 90),
        (5, "encounter", {"resourceType":"Encounter", "type":[{"text":"Primary care follow-up"}], "reasonCode":[{"text":"Blood pressure and diabetes review"}], "status":"finished"}, 45),
        (6, "encounter", {"resourceType":"Encounter", "type":[{"text":"Urgent care assessment"}], "reasonCode":[{"text":"Wheezing and seasonal cough"}], "status":"finished"}, 270),
        (6, "condition", {"resourceType":"Condition", "code":{"text":"Mild intermittent asthma"}, "clinicalStatus":{"text":"Active"}}, 270),
        (7, "report", {"resourceType":"DiagnosticReport", "code":{"text":"Chest X-ray"}, "conclusion":"No acute cardiopulmonary abnormality."}, 270),
        (8, "encounter", {"resourceType":"Encounter", "type":[{"text":"Preventive health visit"}], "reasonCode":[{"text":"Annual wellness check"}], "status":"finished"}, 330),
    ]
    existing_ids = {r[0] for r in db.query(models.Record.source_id).filter(
        models.Record.patient_id == patient.id, models.Record.source_id.like("demo-priya-%")).all()}
    for org_index, kind, fhir, offset in samples:
        source_id = f"demo-priya-{org_index}-{kind}-{offset}"
        if source_id in existing_ids:
            continue
        org = organizations[org_index]
        db.add(models.Record(id=uuid.uuid4(), patient_id=patient.id, type=kind, fhir=fhir,
            source_name=org.name, source_org_id=org.id, source_type="seed", source_id=source_id,
            recorded_date=today - timedelta(days=offset), confidence=1.0, verified=True,
            patient_confirmed=True, status="active"))

    # Patient 2 (Rahul Verma) gets his own history, rather than inheriting the
    # first patient's chart or appearing as an empty placeholder in doctor views.
    if second_user:
        second_patient = db.query(models.Patient).filter(models.Patient.user_id == second_user.id).first()
        if second_patient:
            second_samples = [
                (0, "condition", {"resourceType":"Condition", "code":{"text":"Essential hypertension"}, "clinicalStatus":{"text":"Active"}}, 300),
                (0, "medication", {"resourceType":"MedicationRequest", "status":"active", "medicationCodeableConcept":{"text":"Amlodipine 5 mg"}, "dosage":[{"text":"1 tablet once daily"}], "prescriber":"Dr. Meera Rao"}, 30),
                (1, "observation", {"resourceType":"Observation", "code":{"text":"Blood pressure"}, "valueQuantity":{"value":128,"unit":"mmHg systolic"}}, 30),
                (1, "observation", {"resourceType":"Observation", "code":{"text":"LDL cholesterol"}, "valueQuantity":{"value":108,"unit":"mg/dL"}}, 90),
                (2, "encounter", {"resourceType":"Encounter", "type":[{"text":"Comprehensive eye examination"}], "reasonCode":[{"text":"Routine vision check"}], "status":"finished"}, 120),
                (3, "encounter", {"resourceType":"Encounter", "type":[{"text":"Dental examination and cleaning"}], "reasonCode":[{"text":"Routine dental visit"}], "status":"finished"}, 180),
            ]
            existing_rahul_ids = {row[0] for row in db.query(models.Record.source_id).filter(
                models.Record.patient_id == second_patient.id, models.Record.source_id.like("demo-rahul-%")).all()}
            for org_index, kind, fhir, offset in second_samples:
                source_id = f"demo-rahul-{org_index}-{kind}-{offset}"
                if source_id not in existing_rahul_ids:
                    db.add(models.Record(id=uuid.uuid4(), patient_id=second_patient.id, type=kind, fhir=fhir,
                        source_name=organizations[org_index].name, source_org_id=organizations[org_index].id,
                        source_type="seed", source_id=source_id, recorded_date=today - timedelta(days=offset),
                        confidence=1.0, verified=True, patient_confirmed=True, status="active"))
    now = datetime.now().astimezone()
    consent = db.query(models.Consent).filter(models.Consent.patient_id == patient.id,
        models.Consent.org_id == organizations[0].id, models.Consent.status == "active",
        models.Consent.expires_at > now).first()
    if not consent:
        db.add(models.Consent(id=uuid.uuid4(), patient_id=patient.id, org_id=organizations[0].id,
            status="active", scope="condition,medication,allergy,observation,encounter,report",
            expires_at=datetime.now().astimezone() + timedelta(days=3650)))

    doctor_user = db.query(models.User).filter(models.User.phone == "+919999999999").first()
    doctor = db.query(models.Staff).filter(models.Staff.user_id == doctor_user.id).first() if doctor_user else None
    if doctor and not db.query(models.Appointment).filter(models.Appointment.patient_id == patient.id,
        models.Appointment.status.in_(["booked", "requested"]),
        models.Appointment.time > datetime.now().astimezone()).first():
        appointment_time = datetime.now().astimezone() + timedelta(days=2)
        appointment_time = appointment_time.replace(hour=10, minute=30, second=0, microsecond=0)
        db.add(models.Appointment(id=uuid.uuid4(), patient_id=patient.id, org_id=doctor.org_id,
            doctor_id=doctor.id, time=appointment_time, status="booked",
            reason="Endocrinology follow-up"))

def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--scale", choices=["small", "demo", "full"], default="full")
    parser.add_argument("--as-of", type=str, default="today")
    args = parser.parse_args()

    if args.reset:
        models.Base.metadata.drop_all(bind=engine)
        models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if not args.reset and db.query(models.User).first():
            ensure_hero_history(db)
            db.commit()
            print("Database already seeded. Skipping.")
            return

        scale_map = {"small": 25, "demo": 150, "full": 300}
        total_patients = scale_map[args.scale]

        # In a real implementation this would generate 70k records using bulk_save_objects.
        # For prototype speed and safety, we simulate the bulk insert counts and structures.
        
        # 1. Canonical Organizations
        orgs = []
        source_catalog = [
            ("Kaveri Hospitals", "hospital", "HOSP-KAV-001"),
            ("Metro Diagnostics", "laboratory", "LAB-MET-002"),
            ("ClearView Eye Centre", "clinic", "CLIN-EYE-003"),
            ("Pearl Dental Care", "clinic", "CLIN-DEN-004"),
            ("CareFirst Pharmacy", "pharmacy", "PHARM-CF-005"),
            ("Sanjeevani Family Clinic", "clinic", "CLIN-SAN-006"),
            ("Sunrise Heart & General Hospital", "hospital", "HOSP-SUN-007"),
            ("Apex Imaging", "imaging", "IMG-APX-008"),
            ("Lotus Women & Wellness", "clinic", "CLIN-LOT-009"),
        ]
        for i, (name, org_type, registration_no) in enumerate(source_catalog):
            o = models.Organization(id=uuid.uuid4(), name=name, type=org_type, registration_no=registration_no)
            orgs.append(o)
        db.bulk_save_objects(orgs)
        
        # 2. Staff
        staff_users = []
        staff_list = []
        for i in range(40):
            if i == 0:
                phone = "+919999999999"
                name = "Dr. Meera Rao"
                email = "ramesh.iyer@kaveri.local"
            else:
                phone = f"+919000000{i:03d}"
                name = ["", "Dr. Arjun Menon", "Dr. Ananya Iyer", "Dr. Kabir Shah", "Dr. Nisha Kapoor",
                        "Dr. Rohan Kulkarni", "Dr. Pooja Nair", "Dr. Vikram Desai", "Dr. Sana Khan", "Dr. Dev Patel"][i] if i < 10 else f"Dr. Clinician {i:02d}"
                email = f"staff{i}@hospital.local"
                
            u = models.User(id=uuid.uuid4(), phone=phone, email=email, role="hospital_staff", name=name)
            staff_users.append(u)
            s = models.Staff(id=uuid.uuid4(), user_id=u.id, org_id=orgs[0].id if i == 0 else orgs[i%9].id, role="doctor")
            staff_list.append(s)
        db.bulk_save_objects(staff_users)
        db.bulk_save_objects(staff_list)
        
        # 3. Patients (Hero, Mid, Light)
        patient_users = []
        patients = []
        for i in range(total_patients):
            if i == 0:
                phone = "+919876543210"
                name = "Priya Sharma"
            elif i == 1:
                phone = "+919876543211"
                name = "Rahul Verma"
            else:
                phone = f"+91987654{i:04d}"
                name = f"Patient {i}"
                
            u = models.User(id=uuid.uuid4(), phone=phone, role="patient", name=name)
            patient_users.append(u)
            p = models.Patient(id=uuid.uuid4(), user_id=u.id, dob=date(1980, 1, 1), sex="male" if i == 1 else "female", blood_group="O+")
            patients.append(p)
        db.bulk_save_objects(patient_users)
        db.bulk_save_objects(patients)

        db.commit()
        ensure_hero_history(db)
        db.commit()
        
        print(f"Seed complete. Scale: {args.scale}, Total Patients: {total_patients}")
        
    finally:
        db.close()

if __name__ == "__main__":
    run()
