import subprocess
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import time

router = APIRouter(prefix="/demo", tags=["Demo Control Panel"])

class DemoActionResponse(BaseModel):
    status: str
    message: str
    trace: list[dict]

@router.post("/trigger/{action}")
def trigger_demo_action(action: str):
    trace = [
        {"stage": "FETCH", "status": "pending"},
        {"stage": "PARSE", "status": "pending"},
        {"stage": "MAP", "status": "pending"},
        {"stage": "VALIDATE", "status": "pending"},
        {"stage": "IDENTITY", "status": "pending"},
        {"stage": "STORE", "status": "pending"}
    ]
    
    if action == "metro_hba1c":
        # Simulate firing the webhook and tracing
        trace = [
            {"stage": "FETCH", "status": "success", "msg": "Received CSV row via REST"},
            {"stage": "PARSE", "status": "success", "msg": "Parsed 1 row"},
            {"stage": "MAP", "status": "success", "msg": "Glycosylated Hb -> LOINC 4548-4"},
            {"stage": "VALIDATE", "status": "success", "msg": "Value 8.4% Out of Range"},
            {"stage": "IDENTITY", "status": "success", "msg": "Matched Priya Sharma (MD-111)"},
            {"stage": "STORE", "status": "success", "msg": "Saved as UnifiedRecord"}
        ]
        msg = "Metro Diagnostics published Priya's HbA1c result"
    
    elif action == "sunrise_adt":
        trace = [
            {"stage": "FETCH", "status": "success", "msg": "Received HL7 MLLP over HTTP"},
            {"stage": "PARSE", "status": "success", "msg": "Parsed ADT^A01"},
            {"stage": "MAP", "status": "success", "msg": "Normalized CAD to I25.1"},
            {"stage": "VALIDATE", "status": "success", "msg": "Valid"},
            {"stage": "IDENTITY", "status": "success", "msg": "Matched Ramesh Iyer (SUN-RM)"},
            {"stage": "STORE", "status": "success", "msg": "Saved Encounter"}
        ]
        msg = "Sunrise Heart sent ADT admission for Ramesh Iyer"
        
    elif action == "near_duplicate":
        trace = [
            {"stage": "FETCH", "status": "success", "msg": "Received API Payload"},
            {"stage": "PARSE", "status": "success", "msg": "Parsed JSON"},
            {"stage": "MAP", "status": "success", "msg": "No mapping needed"},
            {"stage": "VALIDATE", "status": "success", "msg": "Valid"},
            {"stage": "IDENTITY", "status": "review_required", "msg": "Score 0.72. Sent to Link Review."},
            {"stage": "STORE", "status": "pending", "msg": "Waiting for manual review"}
        ]
        msg = "New near-duplicate patient arrived (Rahul Varma)"
        
    elif action == "carefirst_conflict":
        trace = [
            {"stage": "FETCH", "status": "success", "msg": "Received Dispense JSON"},
            {"stage": "PARSE", "status": "success", "msg": "Parsed JSON"},
            {"stage": "MAP", "status": "success", "msg": "Aspirin 75mg -> Generic"},
            {"stage": "VALIDATE", "status": "success", "msg": "Valid"},
            {"stage": "IDENTITY", "status": "success", "msg": "Matched Ramesh Iyer"},
            {"stage": "STORE", "status": "success", "msg": "Interaction Alert Fired (NSAID)"}
        ]
        msg = "CareFirst dispensed conflicting drug"
        
    elif action == "break_greenfield":
        trace = [{"stage": "FETCH", "status": "error", "msg": "Connection timeout to mock-greenfield"}]
        msg = "Greenfield PHC feed broken"
        
    else:
        raise HTTPException(404, "Unknown scenario")
        
    return DemoActionResponse(status="success", message=msg, trace=trace)

def execute_reset():
    subprocess.run(["python", "-m", "seed.seed"], check=True)
    subprocess.run(["python", "-m", "seed.seed_catalogs"], check=True)
    
@router.post("/reset")
def reset_demo(background_tasks: BackgroundTasks):
    background_tasks.add_task(execute_reset)
    return {"status": "reset_initiated", "message": "Database and Mock Systems resetting to ground truth in background (approx 25s)."}
