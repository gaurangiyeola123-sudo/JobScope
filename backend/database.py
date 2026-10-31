
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load .env from the backend folder explicitly
BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_FILE)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        f"DATABASE_URL is missing. Check your .env file at: {ENV_FILE}"
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
