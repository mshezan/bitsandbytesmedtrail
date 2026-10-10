with open("api/app/routers/hospital_router.py", "r") as f:
    content = f.read()

new_endpoint = """
class OrderItem(BaseModel):
    test_name: str
    priority: str
    reason: str
    fasting: bool
    override_reason: Optional[str] = None

class OrderPayload(BaseModel):
    items: List[OrderItem]

@router.post("/patient/{patient_id}/order")
def place_order(patient_id: uuid.UUID, payload: OrderPayload, staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    from app.models import Record, AccessEvent
    org = db.query(Organization).filter(Organization.id == staff.org_id).first()
    
    records = []
    for item in payload.items:
        fhir_payload = {
            "resourceType": "ServiceRequest",
            "status": "active",
            "intent": "order",
            "priority": item.priority,
            "code": {"text": item.test_name},
            "reasonCode": [{"text": item.reason}],
            "note": [{"text": f"Fasting: {item.fasting}. Override Reason: {item.override_reason or 'N/A'}"}]
        }
        
        r = Record(
            id=uuid.uuid4(),
            patient_id=patient_id,
            source_org_id=staff.org_id,
            source_name=org.name if org else "Hospital",
            type="observation", # using observation to map broadly or a new type 'procedure'
            fhir=fhir_payload,
            recorded_date=datetime.now(timezone.utc),
            verified=True,
            verified_by_staff_id=staff.id,
            status="active"
        )
        db.add(r)
        records.append(str(r.id))
        
    db.commit()
    return {"status": "success", "order_id": f"ORD-{uuid.uuid4().hex[:8].upper()}"}

@router.get("/inbox")
def get_inbox(staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    # Mocked complex inbox payload for the prototype
    return {
        "results": [
            {
                "id": str(uuid.uuid4()),
                "patient_name": "Priya Sharma",
                "patient_id": "f135b91a-1286-455b-bb68-ec7b4f53ec38", # Will just be used for display
                "test": "HbA1c",
                "value": "9.2%",
                "flag": "critical",
                "previous_value": "8.4%",
                "trend": "up",
                "date": "Today",
                "acknowledged": False
            },
            {
                "id": str(uuid.uuid4()),
                "patient_name": "Ramesh Iyer",
                "patient_id": "f135b91a-1286-455b-bb68-ec7b4f53ec38",
                "test": "Creatinine",
                "value": "1.8 mg/dL",
                "flag": "abnormal",
                "previous_value": "1.4 mg/dL",
                "trend": "up",
                "date": "Yesterday",
                "acknowledged": False
            }
        ],
        "orders": [
            {
                "id": "ORD-1A2B3C",
                "patient_name": "Fatima Khan",
                "test": "Chest X-Ray",
                "status": "pending",
                "priority": "urgent",
                "date": "Today"
            },
            {
                "id": "ORD-9X8Y7Z",
                "patient_name": "Arjun Reddy",
                "test": "Lipid Profile",
                "status": "completed",
                "priority": "routine",
                "date": "Yesterday"
            }
        ]
    }

@router.post("/inbox/{result_id}/acknowledge")
def acknowledge_result(result_id: str, staff: Staff = Depends(get_current_staff), db: Session = Depends(get_db)):
    # In a real system, mark the record/observation as acknowledged by this staff_id
    return {"status": "acknowledged"}
"""

if "class OrderItem" not in content:
    content += new_endpoint
    with open("api/app/routers/hospital_router.py", "w") as f:
        f.write(content)
