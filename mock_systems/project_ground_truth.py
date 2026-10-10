import os
import uuid
import json
import random
import sqlite3
import pandas as pd
from datetime import datetime, timedelta

MOCKS_DIR = "../mock_data"
os.makedirs(MOCKS_DIR, exist_ok=True)

# Define the 9 mocks and their types
MOCKS = {
    "mock-kaveri": "fhir",
    "mock-sunrise": "hl7",
    "mock-metro": "csv",
    "mock-sanjeevani": "folder",
    "mock-carefirst": "json",
    "mock-lotus": "fhir",
    "mock-bharat": "hl7",
    "mock-apex": "json",
    "mock-greenfield": "spreadsheet"
}

for mock in MOCKS:
    os.makedirs(os.path.join(MOCKS_DIR, mock), exist_ok=True)

# Generate a master patient
master_patient = {
    "name": "Priya Sharma",
    "phone": "+919876543210",
    "dob": "1979-05-15",
    "gender": "Female",
    "abha": "91-1234-5678-9012"
}

def get_db(mock_name):
    conn = sqlite3.connect(os.path.join(MOCKS_DIR, mock_name, "system.db"))
    conn.execute("CREATE TABLE IF NOT EXISTS patients (mrn TEXT PRIMARY KEY, name TEXT, phone TEXT, dob TEXT)")
    conn.execute("CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, mrn TEXT, type TEXT, data TEXT)")
    return conn

print(f"Generating Ground Truth for {master_patient['name']}...")

# Project to Kaveri (FHIR)
kaveri_mrn = "KAV-" + str(random.randint(10000, 99999))
conn = get_db("mock-kaveri")
conn.execute("INSERT OR IGNORE INTO patients VALUES (?, ?, ?, ?)", (kaveri_mrn, "P. Sharma", master_patient["phone"], master_patient["dob"]))
fhir_encounter = {
    "resourceType": "Encounter",
    "id": str(uuid.uuid4()),
    "status": "finished",
    "class": {"code": "AMB"},
    "period": {"start": (datetime.now() - timedelta(days=400)).isoformat()}
}
fhir_med = {
    "resourceType": "MedicationRequest",
    "id": str(uuid.uuid4()),
    "medicationCodeableConcept": {"text": "Metformin 500mg"},
    "authoredOn": (datetime.now() - timedelta(days=400)).isoformat()
}
conn.execute("INSERT INTO records VALUES (?, ?, ?, ?)", (fhir_encounter["id"], kaveri_mrn, "Encounter", json.dumps(fhir_encounter)))
conn.execute("INSERT INTO records VALUES (?, ?, ?, ?)", (fhir_med["id"], kaveri_mrn, "MedicationRequest", json.dumps(fhir_med)))
conn.commit()
conn.close()
print(f" -> Projected to Kaveri as {kaveri_mrn}")

# Project to Metro Diagnostics (CSV)
metro_csv = os.path.join(MOCKS_DIR, "mock-metro", "export.csv")
metro_mrn = "MD-" + str(random.randint(100000, 999999))
df = pd.DataFrame([{
    "mrn": metro_mrn,
    "name": "Priya S",
    "test_name": "HbA1c",
    "value": "7.2%", # Formats/units differ!
    "date": (datetime.now() - timedelta(days=200)).strftime("%Y-%m-%d")
}, {
    "mrn": metro_mrn,
    "name": "Priya S",
    "test_name": "HbA1c",
    "value": "8.4%",
    "date": (datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d")
}])
if os.path.exists(metro_csv):
    existing = pd.read_csv(metro_csv)
    df = pd.concat([existing, df])
df.to_csv(metro_csv, index=False)
print(f" -> Projected to Metro Diagnostics as {metro_mrn}")

# Project to Sunrise Heart (HL7)
sunrise_mrn = "SHI" + str(random.randint(1000, 9999))
conn = get_db("mock-sunrise")
conn.execute("INSERT OR IGNORE INTO patients VALUES (?, ?, ?, ?)", (sunrise_mrn, "Priya Sharma", master_patient["phone"], master_patient["dob"]))
hl7_adt = f"MSH|^~\\&|SUNRISE|HIS|MOCK|MEDTRAIL|20230101000000||ADT^A01|MSG001|P|2.4\rPID|1||{sunrise_mrn}||Sharma^Priya||19790515|F\rPV1|1|I|CARDIOLOGY||||||||||||||||||||||||||||||||||||||||||||"
conn.execute("INSERT INTO records VALUES (?, ?, ?, ?)", (str(uuid.uuid4()), sunrise_mrn, "HL7", hl7_adt))
conn.commit()
conn.close()
print(f" -> Projected to Sunrise Heart Institute as {sunrise_mrn}")

# Project to CareFirst (JSON)
carefirst_mrn = "CF-" + str(random.randint(1000, 9999))
conn = get_db("mock-carefirst")
conn.execute("INSERT OR IGNORE INTO patients VALUES (?, ?, ?, ?)", (carefirst_mrn, "Priya Sharma", master_patient["phone"], master_patient["dob"]))
dispense = {
    "dispense_id": str(uuid.uuid4()),
    "patient_id": carefirst_mrn,
    "drug": "Glycomet 1000mg", # Note: She was on 500mg at Kaveri, now 1000mg! Interaction/conflict
    "quantity": 30,
    "date": (datetime.now() - timedelta(days=5)).isoformat()
}
conn.execute("INSERT INTO records VALUES (?, ?, ?, ?)", (dispense["dispense_id"], carefirst_mrn, "Dispensation", json.dumps(dispense)))
conn.commit()
conn.close()
print(f" -> Projected to CareFirst Pharmacy as {carefirst_mrn}")

# Project to Greenfield PHC (Spreadsheet)
green_csv = os.path.join(MOCKS_DIR, "mock-greenfield", "export.csv")
green_mrn = "GF-" + str(random.randint(100, 999))
df_g = pd.DataFrame([{
    "Pat ID": green_mrn,
    "Full Name": "Sharma, Priya",
    "Vitals_BP": "140/90",
    "Visit Date": (datetime.now() - timedelta(days=3)).strftime("%d/%m/%Y") # Mistake/inconsistent date format
}])
if os.path.exists(green_csv):
    existing = pd.read_csv(green_csv)
    df_g = pd.concat([existing, df_g])
df_g.to_csv(green_csv, index=False)
print(f" -> Projected to Greenfield PHC as {green_mrn}")

print("\nSuccess: Patient fragmented across 5 independent mock systems.")
