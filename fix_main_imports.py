with open("api/app/main.py", "r") as f:
    content = f.read()

content = content.replace(
"""from app.routers import auth_router, patient_router

from app.routers.v1.ingest import router as ingest_router
from app.routers.v1.system import router as system_router
, record_router, timeline_router, connector_router, upload_router, share_router, audit_router, care_router""",
"""from app.routers import auth_router, patient_router, record_router, timeline_router, connector_router, upload_router, share_router, audit_router, care_router
from app.routers.v1.ingest import router as ingest_router
from app.routers.v1.system import router as system_router"""
)

with open("api/app/main.py", "w") as f:
    f.write(content)
