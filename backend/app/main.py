import time
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, SessionLocal, wait_for_db, get_db
from app.seed import seed_initial_data
from app.routers import auth, classes, modules, submissions, admin

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

START_TIME = time.time()
_DB_INITIALIZED = False


def init_db_once():
    global _DB_INITIALIZED
    if _DB_INITIALIZED:
        return
    wait_for_db()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
        _DB_INITIALIZED = True
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_once()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="REST API untuk CloudLab Edu — Sistem Manajemen Praktikum Laboratorium Komputer Berbasis Cloud-Native.",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in origins else (origins or ["*"]),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def ensure_db_middleware(request: Request, call_next):
    if not _DB_INITIALIZED:
        init_db_once()
    return await call_next(request)


app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(classes.router, prefix=settings.API_V1_PREFIX)
app.include_router(modules.router, prefix=settings.API_V1_PREFIX)
app.include_router(submissions.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
    }


@app.get(f"{settings.API_V1_PREFIX}/health", tags=["Monitoring"])
def health_check(db: Session = Depends(get_db)):
    t0 = time.perf_counter()
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unhealthy: {exc}"

    latency_ms = round((time.perf_counter() - t0) * 1000, 2)
    uptime_sec = round(time.time() - START_TIME, 1)

    return {
        "status": "ok" if db_status == "healthy" else "degraded",
        "service": "cloudlab-backend-api",
        "version": settings.VERSION,
        "database": db_status,
        "db_latency_ms": latency_ms,
        "uptime_seconds": uptime_sec,
        "storage": admin.get_storage_stats(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }