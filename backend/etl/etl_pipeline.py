
import os
import sys
import pandas as pd

# Add backend directory to Python path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BACKEND_DIR)

from database import Base, engine, SessionLocal
from models import ProcessedJob


# File paths
RAW_FILE = os.path.join(BACKEND_DIR, "data", "jobs.csv")
PROCESSED_DIR = os.path.join(BACKEND_DIR, "data", "processed")
PROCESSED_FILE = os.path.join(PROCESSED_DIR, "jobs_cleaned.csv")


def extract_data():
    """Extract job records from the source CSV."""

    print("\n[EXTRACT] Reading raw job data...")

    if not os.path.exists(RAW_FILE):
        raise FileNotFoundError(f"Dataset not found: {RAW_FILE}")

    df = pd.read_csv(RAW_FILE)

    print(f"[EXTRACT] Records extracted: {len(df)}")

    return df


def clean_data(df):
    """Clean missing values and remove invalid records."""

    print("\n[CLEAN] Cleaning job data...")

    initial_count = len(df)

    df.columns = df.columns.str.strip().str.lower()

    # Remove exact duplicate records
    df = df.drop_duplicates()

    required_columns = [
        "title", "company", "location", "experience",
        "min_salary", "max_salary", "job_type", "skills"
    ]

    df = df.dropna(subset=required_columns).copy()

    text_columns = [
        "title", "company", "location",
        "experience", "job_type", "skills"
    ]

    for column in text_columns:
        df[column] = df[column].astype(str).str.strip()

    df["title"] = df["title"].str.title()
    df["company"] = df["company"].str.strip()

    df["min_salary"] = pd.to_numeric(
        df["min_salary"], errors="coerce"
    )

    df["max_salary"] = pd.to_numeric(
        df["max_salary"], errors="coerce"
    )

    df = df.dropna(
        subset=["min_salary", "max_salary"]
    ).copy()

    df = df[
        (df["min_salary"] >= 0) &
        (df["max_salary"] >= df["min_salary"])
    ].copy()

    df["min_salary"] = df["min_salary"].astype(int)
    df["max_salary"] = df["max_salary"].astype(int)

    for column in text_columns:
        df = df[df[column] != ""]

    print(f"[CLEAN] Initial records: {initial_count}")
    print(f"[CLEAN] Valid records: {len(df)}")
    print(f"[CLEAN] Removed records: {initial_count - len(df)}")

    return df


def transform_data(df):
    """Transform job records into a standardized format."""

    print("\n[TRANSFORM] Transforming job data...")

    df["experience"] = df["experience"].str.strip().str.title()
    df["job_type"] = df["job_type"].str.strip().str.title()

    df["skills"] = df["skills"].apply(
        lambda skills: ";".join(
            sorted(
                set(
                    skill.strip().title()
                    for skill in str(skills).split(";")
                    if skill.strip()
                )
            )
        )
    )

    df["avg_salary"] = (
        df["min_salary"] + df["max_salary"]
    ) // 2

    df = df.reset_index(drop=True)
    df["id"] = range(1, len(df) + 1)

    print("[TRANSFORM] Transformation completed.")

    return df


def load_data(df):
    """Save processed records to a CSV file."""

    print("\n[LOAD] Saving processed CSV...")

    os.makedirs(PROCESSED_DIR, exist_ok=True)

    df.to_csv(PROCESSED_FILE, index=False)

    print(f"[LOAD] Processed CSV saved: {PROCESSED_FILE}")


def load_to_mysql(df):
    """Load processed records into the MySQL database."""

    print("\n[DATABASE LOAD] Connecting to MySQL...")

    # Create the new table if it does not exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        inserted_or_updated = 0

        for record in df.to_dict(orient="records"):
            job = ProcessedJob(
                id=int(record["id"]),
                title=str(record["title"]),
                company=str(record["company"]),
                location=str(record["location"]),
                experience=str(record["experience"]),
                min_salary=int(record["min_salary"]),
                max_salary=int(record["max_salary"]),
                job_type=str(record["job_type"]),
                skills=str(record["skills"]),
                avg_salary=int(record["avg_salary"])
            )

            db.merge(job)
            inserted_or_updated += 1

        db.commit()

        print(
            f"[DATABASE LOAD] Records inserted/updated: "
            f"{inserted_or_updated}"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def run_pipeline():
    """Execute the complete ETL pipeline."""

    print("=" * 50)
    print("       JOBSCOPE ETL PIPELINE")
    print("=" * 50)

    try:
        df = extract_data()
        df = clean_data(df)
        df = transform_data(df)

        load_data(df)
        load_to_mysql(df)

        print("\n" + "=" * 50)
        print("ETL PIPELINE COMPLETED SUCCESSFULLY!")
        print("=" * 50)

    except Exception as error:
        print("\nETL PIPELINE FAILED!")
        print(f"Error: {error}")
        raise


if __name__ == "__main__":
    run_pipeline()
