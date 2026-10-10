with open("api/app/main.py", "r") as f:
    content = f.read()

import_stmt = "from app.routers import patient_router, record_router, auth_router, hospital_router, ingestion_router"
content = content.replace("from app.routers import patient_router, record_router, auth_router, hospital_router", import_stmt)

include_stmt = "app.include_router(hospital_router.router)\napp.include_router(ingestion_router.router)"
content = content.replace("app.include_router(hospital_router.router)", include_stmt)

with open("api/app/main.py", "w") as f:
    f.write(content)
