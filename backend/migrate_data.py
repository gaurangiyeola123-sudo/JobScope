import pandas as pd

from database import engine, SessionLocal, Base
from models import Job

# Create database tables
Base.metadata.create_all(bind=engine)

# Read existing CSV data
df = pd.read_csv("data/jobs.csv")

db = SessionLocal()

try:
    migrated_count = 0

    for _, row in df.iterrows():
        job = Job(
            id=int(row["id"]),
            title=row["title"],
            company=row["company"],
            location=row["location"],
            experience=row["experience"],
            min_salary=int(row["min_salary"]),
            max_salary=int(row["max_salary"]),
            job_type=row["job_type"],
            skills=row["skills"]
        )

        # Insert or update based on primary key
        db.merge(job)
        migrated_count += 1

    db.commit()

    print(f"Migration successful!")
    print(f"Total records processed: {migrated_count}")

except Exception as error:
    db.rollback()
    print("Migration failed:")
    print(error)

finally:
    db.close()