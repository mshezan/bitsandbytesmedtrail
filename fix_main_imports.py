with open("api/app/main.py", "r") as f:
    content = f.read()

content = content.replace("from app.routers import patient_router, record_router, auth_router", "from app.routers import patient_router, record_router, auth_router, ingestion_router")

with open("api/app/main.py", "w") as f:
    f.write(content)
