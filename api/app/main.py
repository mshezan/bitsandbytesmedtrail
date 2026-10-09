import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.logging_config import configure_logging
from app.models import Patient, Record, User
from app.storage import ensure_bucket

configure_logging()
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        ensure_bucket()
    except Exception:
        log.warning("object_store_unavailable_at_startup")
    yield


from app.routers import auth_router, patient_router, record_router, timeline_router, connector_router, upload_router, share_router, audit_router, care_router

app = FastAPI(
    title="MedTrail API",
    description="Unified, shareable medical timeline. Demo data, not medical advice.",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(auth_router.router)
app.include_router(patient_router.router)
app.include_router(record_router.router)
app.include_router(timeline_router.router)
app.include_router(connector_router.router)
app.include_router(upload_router.router)
app.include_router(share_router.router)
app.include_router(audit_router.router)
app.include_router(care_router.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def no_body_logging(request, call_next):
    # Do not read or log request bodies; they may contain clinical data.
    response = await call_next(request)
    log.info("http_request path=%s status=%s", request.url.path, response.status_code)
    return response


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "medtrail-api"}


@app.get("/health/ready")
def ready() -> dict:
    db: Session = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "up"}
    finally:
        db.close()


@app.get("/demo/status")
def demo_status() -> dict:
    """Counts only — no patient identifiers."""
    db: Session = SessionLocal()
    try:
        return {
            "demo_mode": settings.demo_mode,
            "notice": "Demo data, not medical advice",
            "users": db.query(func.count(User.id)).scalar() or 0,
            "patients": db.query(func.count(Patient.id)).scalar() or 0,
            "records": db.query(func.count(Record.id)).scalar() or 0,
            "verified_records": db.query(func.count(Record.id)).filter(Record.verified.is_(True)).scalar()
            or 0,
        }
    finally:
        db.close()
