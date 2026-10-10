with open("api/app/main.py", "r") as f:
    content = f.read()

imports = """
from app.routers.v1.ingest import router as ingest_router
from app.routers.v1.system import router as system_router
"""
if "ingest_router" not in content:
    content = content.replace("from app.routers import auth_router, patient_router", "from app.routers import auth_router, patient_router\n" + imports)

includes = """
app.include_router(ingest_router, prefix="/api/v1")
app.include_router(system_router, prefix="/api/v1")
"""
if "prefix=\"/api/v1\"" not in content:
    content = content.replace('app.include_router(patient_router.router)', 'app.include_router(patient_router.router)\n' + includes)

with open("api/app/main.py", "w") as f:
    f.write(content)
