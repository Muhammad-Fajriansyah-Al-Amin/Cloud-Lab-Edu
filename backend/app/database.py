import time
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger("cloudlab.db")

db_url = settings.DATABASE_URL.strip()
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_size=2,
    max_overflow=3,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def wait_for_db(max_retries: int = 3, delay: float = 0.5):
    last_err = None
    for attempt in range(1, max_retries + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Connected to PostgreSQL database successfully.")
            return
        except Exception as exc:
            last_err = exc
            logger.warning(f"Database attempt {attempt}/{max_retries} failed: {exc}")
            time.sleep(delay)
    raise RuntimeError(f"Database connection failed: {last_err}")