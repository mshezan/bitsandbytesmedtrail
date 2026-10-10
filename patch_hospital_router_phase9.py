with open("api/app/routers/hospital_router.py", "r") as f:
    content = f.read()

new_endpoints = """
@router.get("/analytics")
def get_analytics(staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    from app.models import Record, AccessEvent, Patient
    total_patients = db.query(Patient).count()
    total_records = db.query(Record).count()
    
    # Mock some realistic computations for the prototype
    duplicates_avoided = int(total_records * 0.15)
    savings = duplicates_avoided * 450 # Avg 450 Rs per lab test
    interactions_caught = int(total_patients * 0.8)
    
    return {
        "rupees_saved": savings,
        "duplicates_avoided": duplicates_avoided,
        "interactions_caught": interactions_caught,
        "records_unified": total_records,
        "avg_time_to_history": "12 seconds",
        "corrections_resolved": 14,
        "monthly_savings": [
            {"name": "Jan", "savings": 12000},
            {"name": "Feb", "savings": 15000},
            {"name": "Mar", "savings": 18000},
            {"name": "Apr", "savings": 22000},
            {"name": "May", "savings": savings},
        ]
    }

@router.get("/insights/population")
def get_population_insights(staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    # Mocked global risks based on the unified data premise
    return [
        {"id": 1, "patient": "Priya Sharma", "patient_id": "f135b91a-1286-455b-bb68-ec7b4f53ec38", "risk": "High", "type": "Interaction", "detail": "Aspirin + Ibuprofen"},
        {"id": 2, "patient": "Rahul Verma", "patient_id": "f135b91a-1286-455b-bb68-ec7b4f53ec38", "risk": "Medium", "type": "Duplicate Rx", "detail": "Metformin prescribed by 2 orgs"},
        {"id": 3, "patient": "Anita Desai", "patient_id": "f135b91a-1286-455b-bb68-ec7b4f53ec38", "risk": "High", "type": "Abnormal Trend", "detail": "HbA1c increased from 7.2 to 9.1%"},
        {"id": 4, "patient": "Vikram Singh", "patient_id": "f135b91a-1286-455b-bb68-ec7b4f53ec38", "risk": "Medium", "type": "Overdue Test", "detail": "TSH overdue by 3 months"}
    ]

@router.get("/access")
def get_access_history(staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    from app.models import AccessEvent, Patient
    events = db.query(AccessEvent).order_by(AccessEvent.created_at.desc()).limit(50).all()
    
    res = []
    for e in events:
        p = db.query(Patient).filter(Patient.id == e.patient_id).first()
        res.append({
            "id": str(e.id),
            "date": str(e.created_at.strftime("%Y-%m-%d %H:%M:%S")),
            "patient": p.user.name if p else "Unknown",
            "purpose": e.purpose,
            "scope": e.scope,
            "ip": e.ip
        })
    return res
"""

if "/analytics" not in content:
    content += new_endpoints
    with open("api/app/routers/hospital_router.py", "w") as f:
        f.write(content)

