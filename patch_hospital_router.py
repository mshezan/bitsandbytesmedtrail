with open("api/app/routers/hospital_router.py", "r") as f:
    content = f.read()

new_route = """
@router.get("/my-day")
def get_my_day(staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    import datetime
    import random
    
    # Fetch some patients to use in the mock schedule
    patients = db.query(Patient).limit(5).all()
    schedule = []
    statuses = ["Done", "In consult", "Waiting", "Arrived", "Booked"]
    times = ["09:00 AM", "10:30 AM", "11:15 AM", "01:00 PM", "02:30 PM"]
    
    for i, p in enumerate(patients):
        u = p.user
        schedule.append({
            "id": p.id,
            "time": times[i % len(times)],
            "patient_name": u.name if u else "Unknown",
            "age": 45 + i,
            "sex": u.sex if u else "U",
            "reason": "Follow-up" if i % 2 == 0 else "New Consult",
            "status": statuses[i % len(statuses)],
            "flags": ["high-risk"] if i == 1 else (["allergy"] if i == 2 else [])
        })
        
    return {
        "doctor_name": staff.user.name if staff.user else "Doctor",
        "clinic": staff.organization.name if staff.organization else "Hospital",
        "stats": {
            "patients_today": 12,
            "waiting_now": 2,
            "results_review": 4,
            "open_alerts": 1
        },
        "schedule": schedule,
        "needs_attention": [
            {"id": 1, "type": "lab_critical", "title": "Critical HbA1c: 9.2%", "patient": "Priya Sharma", "time": "10 mins ago"},
            {"id": 2, "type": "interaction", "title": "Drug Interaction Warning", "patient": "Ramesh Iyer", "time": "1 hour ago"}
        ],
        "activity_feed": [
            {"id": 1, "text": "Discharge summary added from Sunrise Heart Institute", "patient": "Kavita Nair", "time": "2 hours ago"}
        ]
    }
"""

if "/my-day" not in content:
    content += new_route
    with open("api/app/routers/hospital_router.py", "w") as f:
        f.write(content)
