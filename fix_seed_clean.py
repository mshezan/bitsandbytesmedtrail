import re

with open("api/seed/seed.py", "r") as f:
    text = f.read()

# We have duplicate code. Let's find def seed_patient_a and the next def seed_patient_b.
start = text.find("def seed_patient_a")
end = text.find("def seed_patient_b")

patient_a_code = """def seed_patient_a(db: Session, p: Patient) -> None:
    \"\"\"Diabetes + hypertension; massive data for widgets.\"\"\"
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

"""
text = text[:start] + patient_a_code + text[end:]

with open("api/seed/seed.py", "w") as f:
    f.write(text)
