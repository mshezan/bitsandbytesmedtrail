import os
import json
import sqlite3
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse, FileResponse
import pandas as pd

app = FastAPI()

SYSTEM_TYPE = os.getenv("SYSTEM_TYPE", "fhir")
ORG_NAME = os.getenv("ORG_NAME", "Mock Org")
DATA_DIR = os.getenv("DATA_DIR", "/data")

os.makedirs(DATA_DIR, exist_ok=True)

def get_db():
    conn = sqlite3.connect(os.path.join(DATA_DIR, "system.db"))
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/")
def health():
    return {"status": "ok", "org": ORG_NAME, "type": SYSTEM_TYPE}

# ==========================================
# 1. FHIR Endpoints (Kaveri, Lotus)
# ==========================================
if SYSTEM_TYPE == "fhir":
    @app.get("/Patient")
    def get_patients():
        conn = get_db()
        patients = conn.execute("SELECT * FROM patients").fetchall()
        return {"resourceType": "Bundle", "type": "searchset", "entry": [
            {"resource": {"resourceType": "Patient", "id": p["mrn"], "name": [{"text": p["name"]}], "telecom": [{"system": "phone", "value": p["phone"]}]}}
            for p in patients
        ]}

    @app.get("/Patient/{mrn}")
    def get_patient(mrn: str):
        conn = get_db()
        p = conn.execute("SELECT * FROM patients WHERE mrn=?", (mrn,)).fetchone()
        if not p: raise HTTPException(404)
        return {"resourceType": "Patient", "id": p["mrn"], "name": [{"text": p["name"]}]}

    @app.get("/Observation")
    def get_observations(patient: str = None):
        conn = get_db()
        if patient:
            obs = conn.execute("SELECT * FROM records WHERE mrn=? AND type='Observation'", (patient,)).fetchall()
        else:
            obs = conn.execute("SELECT * FROM records WHERE type='Observation'").fetchall()
        return {"resourceType": "Bundle", "entry": [json.loads(o["data"]) for o in obs]}

# ==========================================
# 2. HL7 v2 Endpoints (Sunrise, Bharat)
# ==========================================
elif SYSTEM_TYPE == "hl7":
    @app.post("/mllp_http")
    async def receive_hl7(request: Request):
        body = await request.body()
        return Response(content="MSH|^~\&|MOCK_ACK||||||ACK|||2.4\rMSA|AA|12345\r", media_type="text/plain")

    @app.get("/export/hl7")
    def export_hl7():
        conn = get_db()
        records = conn.execute("SELECT data FROM records").fetchall()
        # Return as a big string block of HL7 messages
        text = "\n\n".join([r["data"] for r in records])
        return Response(content=text, media_type="text/plain")

# ==========================================
# 3. CSV + PDF (Metro Diagnostics, Greenfield)
# ==========================================
elif SYSTEM_TYPE in ["csv", "spreadsheet"]:
    @app.get("/export/data.csv")
    def export_csv():
        csv_path = os.path.join(DATA_DIR, "export.csv")
        if not os.path.exists(csv_path):
            return Response("mrn,name,test_name,value,date\n", media_type="text/csv")
        return FileResponse(csv_path, media_type="text/csv")

    @app.get("/reports/{report_id}.pdf")
    def get_pdf(report_id: str):
        pdf_path = os.path.join(DATA_DIR, f"{report_id}.pdf")
        if not os.path.exists(pdf_path):
            raise HTTPException(404)
        return FileResponse(pdf_path, media_type="application/pdf")

# ==========================================
# 4. Proprietary JSON (CareFirst, Apex)
# ==========================================
elif SYSTEM_TYPE == "json":
    @app.get("/api/v1/dispensations")
    def get_dispensations(since: str = None):
        conn = get_db()
        recs = conn.execute("SELECT data FROM records").fetchall()
        return {"status": "success", "data": [json.loads(r["data"]) for r in recs]}

# ==========================================
# 5. Drop Folder (Sanjeevani)
# ==========================================
elif SYSTEM_TYPE == "folder":
    @app.get("/list_files")
    def list_files():
        files = os.listdir(DATA_DIR)
        return {"files": [f for f in files if f.endswith(".pdf") or f.endswith(".jpg")]}
    
    @app.get("/download/{filename}")
    def download_file(filename: str):
        path = os.path.join(DATA_DIR, filename)
        if not os.path.exists(path):
            raise HTTPException(404)
        return FileResponse(path)

# ==========================================
# Webhook / Admin injection for all
# ==========================================
@app.post("/admin/inject")
async def inject_record(req: Request):
    data = await req.json()
    conn = get_db()
    conn.execute("CREATE TABLE IF NOT EXISTS patients (mrn TEXT PRIMARY KEY, name TEXT, phone TEXT, dob TEXT)")
    conn.execute("CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, mrn TEXT, type TEXT, data TEXT)")
    
    # Inject logic... (mocked for simplicity)
    conn.commit()
    return {"status": "injected"}

