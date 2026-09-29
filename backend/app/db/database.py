import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from backend.app.core.config import settings
from backend.app.models.incident import Base

logger = logging.getLogger(__name__)

# Normalize DATABASE_URL for sync SQLAlchemy
database_url = settings.DATABASE_URL
if database_url.startswith("sqlite+aiosqlite:///"):
    database_url = database_url.replace("sqlite+aiosqlite:///", "sqlite:///")

connect_args = {"check_same_thread": False} if "sqlite" in database_url else {}

try:
    engine = create_engine(
        database_url,
        echo=False,
        connect_args=connect_args
    )
except Exception as e:
    logger.warning(f"Could not connect to {database_url} ({e}). Falling back to local sqlite:///./flowops.db")
    database_url = "sqlite:///./flowops.db"
    engine = create_engine(
        database_url,
        echo=False,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes tables in database."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
