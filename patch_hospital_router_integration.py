with open("api/app/routers/hospital_router.py", "r") as f:
    content = f.read()

new_routes = """
@router.get("/integration/stats")
def get_integration_stats(db: Session = Depends(get_db)):
    return {
        "organizations_connected": 9,
        "records_unified": 8192,
        "patients_matched_multiple": 18,
        "duplicates_prevented": 305,
        "mapping_coverage": 98.4
    }

@router.get("/integration/nodes")
def get_integration_nodes(db: Session = Depends(get_db)):
    return [
        {"id": "mock-kaveri", "name": "Kaveri Multispeciality", "type": "hospital", "format": "FHIR R4", "status": "online", "records": 4120, "last_sync": "2m ago"},
        {"id": "mock-sunrise", "name": "Sunrise Heart", "type": "hospital", "format": "HL7 v2", "status": "online", "records": 1050, "last_sync": "5m ago"},
        {"id": "mock-metro", "name": "Metro Diagnostics", "type": "lab", "format": "CSV/REST", "status": "online", "records": 890, "last_sync": "Just now"},
        {"id": "mock-sanjeevani", "name": "Sanjeevani Clinic", "type": "clinic", "format": "PDF/OCR", "status": "degraded", "records": 120, "last_sync": "1h ago"},
        {"id": "mock-carefirst", "name": "CareFirst Pharmacy", "type": "pharmacy", "format": "JSON API", "status": "online", "records": 540, "last_sync": "10m ago"},
        {"id": "mock-lotus", "name": "Lotus Women", "type": "hospital", "format": "FHIR R4", "status": "online", "records": 600, "last_sync": "12m ago"},
        {"id": "mock-bharat", "name": "Bharat ER", "type": "hospital", "format": "HL7 v2", "status": "online", "records": 330, "last_sync": "4m ago"},
        {"id": "mock-apex", "name": "Apex Imaging", "type": "imaging", "format": "DICOM/PDF", "status": "online", "records": 142, "last_sync": "20m ago"},
        {"id": "mock-greenfield", "name": "Greenfield PHC", "type": "clinic", "format": "XLSX", "status": "online", "records": 400, "last_sync": "1d ago"}
    ]

@router.get("/integration/queue/identity")
def get_identity_queue(db: Session = Depends(get_db)):
    return [
        {
            "id": "q-1",
            "score": 0.72,
            "source": {"name": "Rahul Varma", "dob": "1982-05-05", "phone": "+914444444444", "org": "Kaveri Multispeciality"},
            "target": {"name": "Rahul Verma", "dob": "1980-01-01", "phone": "+915555555555", "org": "MedTrail Core"}
        }
    ]
"""

if "@router.get(\"/integration/stats\")" not in content:
    content += new_routes
    with open("api/app/routers/hospital_router.py", "w") as f:
        f.write(content)
