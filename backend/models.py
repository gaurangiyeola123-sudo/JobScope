from sqlalchemy import Column, Integer, String, BigInteger, Float, Text
from sqlalchemy import Column, Integer, String
from database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    company = Column(String(150), nullable=False)
    location = Column(String(100), nullable=False)
    experience = Column(String(50), nullable=False)
    min_salary = Column(Integer, nullable=False)
    max_salary = Column(Integer, nullable=False)
    job_type = Column(String(50), nullable=False)
    skills = Column(String(500), nullable=False)


class ProcessedJob(Base):
    __tablename__ = "jobs_processed"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    company = Column(String(150), nullable=False)
    location = Column(String(100), nullable=False)
    experience = Column(String(50), nullable=False)
    min_salary = Column(Integer, nullable=False)
    max_salary = Column(Integer, nullable=False)
    job_type = Column(String(50), nullable=False)
    skills = Column(String(500), nullable=False)
    avg_salary = Column(Integer, nullable=False)

class RealJob(Base):
    __tablename__ = "real_jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)

    source_job_id = Column(BigInteger, unique=True, nullable=False, index=True)

    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    location = Column(String(500), nullable=True)

    currency = Column(String(10), nullable=True)
    job_uploaded = Column(String(100), nullable=True)

    experience = Column(String(100), nullable=True)
    min_experience = Column(Integer, nullable=True)
    max_experience = Column(Integer, nullable=True)

    min_salary = Column(BigInteger, nullable=True)
    max_salary = Column(BigInteger, nullable=True)

    skills = Column(Text, nullable=True)
    job_description = Column(Text, nullable=True)

    company_id = Column(BigInteger, nullable=True)
    reviews_count = Column(Float, nullable=True)
    aggregate_rating = Column(Float, nullable=True)
