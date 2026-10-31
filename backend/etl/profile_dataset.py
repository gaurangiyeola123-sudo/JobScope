
import os
import pandas as pd

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATASET_PATH = os.path.join(
    BACKEND_DIR,
    "data",
    "raw",
    "indian_jobs_raw.csv"
)

CHUNK_SIZE = 10000

total_records = 0
missing_values = {}
duplicate_ids = set()
seen_ids = set()
salary_undisclosed = 0
invalid_salary = 0
currency_counts = {}
experience_counts = {}

print("=" * 60)
print("       JOBSCOPE FULL DATASET PROFILING")
print("=" * 60)

for chunk in pd.read_csv(DATASET_PATH, chunksize=CHUNK_SIZE):

    total_records += len(chunk)

    # Missing values
    for column in chunk.columns:
        missing_values[column] = (
            missing_values.get(column, 0)
            + chunk[column].isna().sum()
        )

    # Duplicate job IDs
    for job_id in chunk["jobId"].dropna():
        job_id = int(job_id)

        if job_id in seen_ids:
            duplicate_ids.add(job_id)
        else:
            seen_ids.add(job_id)

    # Salary analysis
    minimum = pd.to_numeric(
        chunk["minimumSalary"], errors="coerce"
    )

    maximum = pd.to_numeric(
        chunk["maximumSalary"], errors="coerce"
    )

    salary_undisclosed += (
        (minimum.fillna(0) == 0) &
        (maximum.fillna(0) == 0)
    ).sum()

    invalid_salary += (
        (minimum < 0) |
        (maximum < minimum)
    ).fillna(False).sum()

    # Currency distribution
    currencies = chunk["currency"].fillna("Missing").value_counts()

    for currency, count in currencies.items():
        currency_counts[currency] = (
            currency_counts.get(currency, 0) + count
        )

    # Experience distribution
    experiences = (
        chunk["experience"]
        .fillna("Missing")
        .value_counts()
    )

    for experience, count in experiences.items():
        experience_counts[experience] = (
            experience_counts.get(experience, 0) + count
        )


print("\n1. TOTAL RECORDS")
print("-" * 40)
print(total_records)

print("\n2. MISSING VALUES")
print("-" * 40)

for column, count in missing_values.items():
    print(f"{column}: {count}")

print("\n3. DUPLICATE JOB IDs")
print("-" * 40)
print(len(duplicate_ids))

print("\n4. UNDISCLOSED SALARIES")
print("-" * 40)
print(salary_undisclosed)

print("\n5. INVALID SALARY RECORDS")
print("-" * 40)
print(invalid_salary)

print("\n6. CURRENCY DISTRIBUTION")
print("-" * 40)

for currency, count in currency_counts.items():
    print(f"{currency}: {count}")

print("\n7. EXPERIENCE DISTRIBUTION")
print("-" * 40)

for experience, count in sorted(experience_counts.items()):
    print(f"{experience}: {count}")

print("\n" + "=" * 60)
print("DATASET PROFILING COMPLETED!")
print("=" * 60)
