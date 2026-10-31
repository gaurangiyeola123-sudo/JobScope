
import os
import sys
import pandas as pd

from sqlalchemy.dialects.mysql import insert

# Add backend directory to Python path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)

from database import engine, SessionLocal, Base
from models import RealJob


RAW_FILE = os.path.join(
    BACKEND_DIR,
    "data",
    "raw",
    "indian_jobs_raw.csv"
)

CHUNK_SIZE = 10000
BATCH_SIZE = 1000


def clean_text(value):
    if pd.isna(value):
        return None

    value = str(value).strip()

    if value.lower() in ("", "nan", "none", "null"):
        return None

    return value


def clean_number(value):
    if pd.isna(value):
        return None

    try:
        number = float(value)

        if number <= 0:
            return None

        return int(number) if number.is_integer() else number

    except (ValueError, TypeError):
        return None


def clean_skills(value):
    value = clean_text(value)

    if not value:
        return ""

    skills = []
    seen = set()

    for skill in value.split(","):
        skill = skill.strip()

        if skill and skill.lower() not in seen:
            skills.append(skill)
            seen.add(skill.lower())

    return ";".join(skills)


def transform_row(row):
    min_salary = clean_number(row.get("minimumSalary"))
    max_salary = clean_number(row.get("maximumSalary"))

    # Treat undisclosed salary as NULL, not zero.
    if min_salary is None and max_salary is None:
        min_salary = None
        max_salary = None

    return {
        "source_job_id": int(row["jobId"]),
        "title": clean_text(row.get("title")) or "Unknown",
        "company": clean_text(row.get("companyName")) or "Unknown",
        "location": clean_text(row.get("location")),
        "currency": clean_text(row.get("currency")),
        "job_uploaded": clean_text(row.get("jobUploaded")),
        "experience": clean_text(row.get("experience")),
        "min_experience": clean_number(row.get("minimumExperience")),
        "max_experience": clean_number(row.get("maximumExperience")),
        "min_salary": min_salary,
        "max_salary": max_salary,
        "skills": clean_skills(row.get("tagsAndSkills")),
        "job_description": clean_text(row.get("jobDescription")),
        "company_id": clean_number(row.get("companyId")),
        "reviews_count": clean_number(row.get("ReviewsCount")),
        "aggregate_rating": (
            float(row["AggregateRating"])
            if pd.notna(row.get("AggregateRating"))
            and str(row["AggregateRating"]).strip() != ""
            else None
        ),
    }


def main():
    if not os.path.exists(RAW_FILE):
        print(f"Dataset not found: {RAW_FILE}")
        return

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    total_processed = 0
    total_inserted = 0
    total_duplicates = 0
    seen_ids = set()

    print("Starting real job dataset import...")
    print(f"Dataset: {RAW_FILE}")

    try:
        for chunk_number, chunk in enumerate(
            pd.read_csv(RAW_FILE, chunksize=CHUNK_SIZE),
            start=1
        ):
            chunk = chunk.dropna(subset=["jobId", "title"])

            records = []

            for _, row in chunk.iterrows():
                source_id = clean_number(row["jobId"])

                if source_id is None:
                    continue

                source_id = int(source_id)

                if source_id in seen_ids:
                    total_duplicates += 1
                    continue

                seen_ids.add(source_id)

                record = transform_row(row)
                records.append(record)

            for start in range(0, len(records), BATCH_SIZE):
                batch = records[start:start + BATCH_SIZE]

                if not batch:
                    continue

                statement = insert(RealJob).values(batch)

                update_values = {
                    key: getattr(statement.inserted, key)
                    for key in batch[0].keys()
                    if key != "source_job_id"
                }

                statement = statement.on_duplicate_key_update(
                    **update_values
                )

                result = db.execute(statement)
                total_inserted += max(result.rowcount, 0)

            db.commit()

            total_processed += len(chunk)

            print(
                f"Chunk {chunk_number} completed | "
                f"Processed: {total_processed:,} | "
                f"Inserted/updated: {total_inserted:,} | "
                f"Duplicates skipped: {total_duplicates:,}"
            )

        print("\nDataset import completed.")
        print(f"Total source rows processed: {total_processed:,}")
        print(f"Unique job IDs found: {len(seen_ids):,}")
        print(f"Duplicates skipped within CSV: {total_duplicates:,}")
        print(f"Rows inserted/updated: {total_inserted:,}")

        print("\nMySQL verification:")
        print(f"Total records in real_jobs: {db.query(RealJob).count():,}")

    except Exception as error:
        db.rollback()
        print("\nIMPORT FAILED:")
        print(error)
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
