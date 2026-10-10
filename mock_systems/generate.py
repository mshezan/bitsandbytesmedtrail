import os
import sys
import uuid
import json
import random
import argparse
import sqlite3
import pandas as pd
from datetime import datetime, timedelta

MOCKS_DIR = "/mock_data"
GROUND_TRUTH_FILE = os.path.join(MOCKS_DIR, "ground_truth.json")

ORG_MAPPING = {
    "Kaveri": {"id": "mock-kaveri", "type": "fhir"},
    "Sunrise": {"id": "mock-sunrise", "type": "hl7"},
    "Metro": {"id": "mock-metro", "type": "csv"},
    "Sanjeevani": {"id": "mock-sanjeevani", "type": "folder"},
    "CareFirst": {"id": "mock-carefirst", "type": "json"},
    "Lotus": {"id": "mock-lotus", "type": "fhir"},
    "Bharat": {"id": "mock-bharat", "type": "hl7"},
    "Apex": {"id": "mock-apex", "type": "json"},
    "Greenfield": {"id": "mock-greenfield", "type": "spreadsheet"}
}

def ensure_dirs():
    os.makedirs(MOCKS_DIR, exist_ok=True)
    for org in ORG_MAPPING.values():
        os.makedirs(os.path.join(MOCKS_DIR, org["id"]), exist_ok=True)

def get_db(mock_id):
    conn = sqlite3.connect(os.path.join(MOCKS_DIR, mock_id, "system.db"))
    conn.execute("CREATE TABLE IF NOT EXISTS patients (mrn TEXT PRIMARY KEY, name TEXT, phone TEXT, dob TEXT)")
    conn.execute("CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, mrn TEXT, type TEXT, data TEXT)")
    return conn

class Projector:
    def __init__(self):
        self.conns = {k: get_db(v["id"]) for k, v in ORG_MAPPING.items() if v["type"] in ["fhir", "hl7", "json"]}
        self.csv_dfs = {"Metro": [], "Greenfield": []}
        self.patients_seen = {k: set() for k in ORG_MAPPING.keys()}

    def register_patient(self, org, mrn, name, phone, dob):
        if org in self.conns:
            if mrn not in self.patients_seen[org]:
                self.conns[org].execute("INSERT OR IGNORE INTO patients VALUES (?, ?, ?, ?)", (mrn, name, phone, dob))
                self.patients_seen[org].add(mrn)

    def write_fhir(self, org, mrn, resource_type, payload):
        conn = self.conns[org]
        payload["resourceType"] = resource_type
        payload["id"] = str(uuid.uuid4())
        conn.execute("INSERT INTO records VALUES (?, ?, ?, ?)", (payload["id"], mrn, resource_type, json.dumps(payload)))

    def write_hl7(self, org, mrn, msg_type, content):
        conn = self.conns[org]
        msg_id = str(uuid.uuid4())
        hl7 = f"MSH|^~\\&|{org.upper()}|HIS|MOCK|MEDTRAIL|20230101||{msg_type}|{msg_id}|P|2.4\rPID|1||{mrn}||{content}"
        conn.execute("INSERT INTO records VALUES (?, ?, ?, ?)", (msg_id, mrn, "HL7", hl7))

    def write_json(self, org, mrn, rec_type, payload):
        conn = self.conns[org]
        rec_id = str(uuid.uuid4())
        payload["id"] = rec_id
        payload["mrn"] = mrn
        conn.execute("INSERT INTO records VALUES (?, ?, ?, ?)", (rec_id, mrn, rec_type, json.dumps(payload)))

    def add_csv(self, org, row):
        self.csv_dfs[org].append(row)

    def finalize(self):
        for conn in self.conns.values():
            conn.commit()
            conn.close()
            
        if self.csv_dfs["Metro"]:
            df = pd.DataFrame(self.csv_dfs["Metro"])
            df.to_csv(os.path.join(MOCKS_DIR, ORG_MAPPING["Metro"]["id"], "export.csv"), index=False)
            
        if self.csv_dfs["Greenfield"]:
            df = pd.DataFrame(self.csv_dfs["Greenfield"])
            df.to_csv(os.path.join(MOCKS_DIR, ORG_MAPPING["Greenfield"]["id"], "export.csv"), index=False)

def build_scenarios(proj):
    # 1. Priya Sharma, 47: HbA1c Metro (21d ago) vs Kaveri (ordered today), Metformin 500mg Sanjeevani vs 1000mg Kaveri, Lipid 16mo ago, Sunrise Echo, 8 orgs
    # Metro
    proj.register_patient("Metro", "MD-111", "Priya S.", "+919876543210", "1979-05-15")
    proj.add_csv("Metro", {"mrn": "MD-111", "name": "Priya S.", "test_name": "HbA1c", "value": "7.8%", "date": (datetime.now() - timedelta(days=21)).strftime("%Y-%m-%d")})
    proj.add_csv("Metro", {"mrn": "MD-111", "name": "Priya S.", "test_name": "Lipid Profile", "value": "Normal", "date": (datetime.now() - timedelta(days=480)).strftime("%Y-%m-%d")}) # 16 mo ago

    # Kaveri
    proj.register_patient("Kaveri", "KAV-PRI", "Priya Sharma", "+919876543210", "1979-05-15")
    proj.write_fhir("Kaveri", "KAV-PRI", "MedicationRequest", {"medicationCodeableConcept": {"text": "Tab Metformin 1000 BD"}, "authoredOn": (datetime.now() - timedelta(days=5)).isoformat()})
    proj.write_fhir("Kaveri", "KAV-PRI", "ServiceRequest", {"code": {"text": "Glycosylated Hb"}, "authoredOn": datetime.now().isoformat()})

    # Sanjeevani (Folder text representation for this script mock)
    # Metformin 500 mg

    # Sunrise
    proj.register_patient("Sunrise", "SUN-99", "Sharma, Priya", "+919876543210", "19790515")
    proj.write_hl7("Sunrise", "SUN-99", "ORU^R01", "OBR|1|||ECHO^Echocardiogram|||20230501|||||||||||||||CARDIOLOGY\rOBX|1|TX|FINDINGS||Normal LV function")

    # 2. Ramesh Iyer, 58: CAD/angioplasty Sunrise, arrives Bharat ER (no history), diabetes drugs CareFirst, NSAID interaction
    proj.register_patient("Sunrise", "SUN-RM", "Ramesh Iyer", "+919999988888", "19651010")
    proj.write_hl7("Sunrise", "SUN-RM", "ADT^A01", "DG1|1||I25.1^CAD|||A\rPR1|1||36.06^Angioplasty")
    
    proj.register_patient("Bharat", "BH-RM", "Iyer Ramesh", "+919999988888", "19651010")
    proj.write_hl7("Bharat", "BH-RM", "ADT^A04", "PV1|1|E|EMERGENCY||||||||||||||||||||||||||||||||||||||||||||")
    
    proj.register_patient("CareFirst", "CF-RM", "Ramesh Iyer", "+919999988888", "1965-10-10")
    proj.write_json("CareFirst", "CF-RM", "Dispensation", {"drug": "Ibuprofen 400mg", "qty": 10})
    proj.write_json("CareFirst", "CF-RM", "Dispensation", {"drug": "Aspirin 75mg", "qty": 30}) # NSAID interaction

    # 3. Fatima Khan, 34: Penicillin allergy Lotus, Amoxicillin Kaveri
    proj.register_patient("Lotus", "LOT-FK", "Fatima Khan", "+917777777777", "1990-01-01")
    proj.write_fhir("Lotus", "LOT-FK", "AllergyIntolerance", {"code": {"text": "Penicillin"}, "reaction": [{"manifestation": [{"text": "Anaphylaxis"}]}]})
    
    proj.register_patient("Kaveri", "KAV-FK", "Fatima K.", "+917777777777", "1990-01-01")
    proj.write_fhir("Kaveri", "KAV-FK", "MedicationRequest", {"medicationCodeableConcept": {"text": "Amoxicillin 500mg"}, "authoredOn": datetime.now().isoformat()})

    # 4. Arjun Reddy, 29: Move HYD->DEL, unconscious ER
    proj.register_patient("Sunrise", "SUN-AR", "Arjun Reddy", "+918888888888", "1995-02-02")
    proj.register_patient("Bharat", "BH-AR", "Arjun Reddy", "+918888888888", "19950202")
    proj.write_hl7("Bharat", "BH-AR", "ADT^A04", "PV1|1|E|EMERGENCY||||||||||||||||||||||||||||||||||||||||||||")

    # 5. Kavita Nair, 62: CKD, Creatinine Metro (mg/dL), Kaveri (umol/L), Greenfield
    proj.register_patient("Metro", "MD-KN", "Kavita Nair", "+916666666666", "1962-03-03")
    proj.add_csv("Metro", {"mrn": "MD-KN", "name": "Kavita Nair", "test_name": "Serum Creatinine", "value": "1.8 mg/dL", "date": "2023-01-01"})
    
    proj.register_patient("Kaveri", "KAV-KN", "Mrs. Kavita Nair", "+916666666666", "1962-03-03")
    proj.write_fhir("Kaveri", "KAV-KN", "Observation", {"code": {"text": "Creatinine"}, "valueQuantity": {"value": 159, "unit": "umol/L"}, "effectiveDateTime": "2023-06-01"})
    
    proj.register_patient("Greenfield", "GF-KN", "Nair, Kavita", "+916666666666", "1962-03-03")
    proj.add_csv("Greenfield", {"Pat ID": "GF-KN", "Full Name": "Nair, Kavita", "Vitals_BP": "150/90", "Visit Date": "01/09/2023"})

    # 6. Near Duplicates & Duplicate Spelling
    proj.register_patient("Kaveri", "KAV-RV1", "Rahul Verma", "+915555555555", "1980-01-01") # Person A
    proj.register_patient("Kaveri", "KAV-RV2", "Rahul Varma", "+914444444444", "1982-05-05") # Person B (different)
    
    proj.register_patient("Sunrise", "SUN-LX1", "Lakshmi N.", "+913333333333", "1975-10-10") # Person C
    proj.register_patient("CareFirst", "CF-LX1", "Laxmi N", "+913333333333", "1975-10-10") # Same Person C

def generate(scale):
    ensure_dirs()
    proj = Projector()
    
    print("Building specific planted scenarios...")
    build_scenarios(proj)
    
    print("Building remaining regular patients...")
    # Add random filler to reach 40 patients if full scale
    target = 40 if scale == "full" else 10
    
    for i in range(target - 6):
        mrn = f"GEN-{i}"
        proj.register_patient("Kaveri", mrn, f"Patient {i}", f"+91900000{i:04d}", "1990-01-01")
        proj.write_fhir("Kaveri", mrn, "Encounter", {"status": "finished"})

    proj.finalize()
    
    # Write empty ground truth file for demo
    with open(GROUND_TRUTH_FILE, "w") as f:
        json.dump({"status": "generated", "patients": target}, f)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true")
    parser.add_argument("--scale", choices=["full", "small"], default="small")
    args = parser.parse_args()
    
    if args.reset:
        for org in ORG_MAPPING.values():
            db_path = os.path.join(MOCKS_DIR, org["id"], "system.db")
            if os.path.exists(db_path): os.remove(db_path)
            csv_path = os.path.join(MOCKS_DIR, org["id"], "export.csv")
            if os.path.exists(csv_path): os.remove(csv_path)

    generate(args.scale)
    print("Ground truth and projections generated successfully.")
