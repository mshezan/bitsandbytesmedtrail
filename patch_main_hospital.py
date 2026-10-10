with open("api/app/main.py", "r") as f:
    content = f.read()

content = content.replace(
    "from app.routers import auth_router, patient_router, record_router, timeline_router, connector_router, upload_router, share_router, audit_router, care_router",
    "from app.routers import auth_router, patient_router, record_router, timeline_router, connector_router, upload_router, share_router, audit_router, care_router, hospital_router"
)

content = content.replace(
    "app.include_router(patient_router.router)",
    "app.include_router(patient_router.router)\napp.include_router(hospital_router.router)"
)

with open("api/app/main.py", "w") as f:
    f.write(content)
