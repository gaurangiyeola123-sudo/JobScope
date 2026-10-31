
import os
import pandas as pd

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATASET_PATH = os.path.join(
    BACKEND_DIR,
    "data",
    "raw",
    "indian_jobs_raw.csv"
)

print("=" * 60)
print("       JOBSCOPE DATASET INSPECTION")
print("=" * 60)

if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError(
        f"Dataset not found: {DATASET_PATH}"
    )

# Read only the first 5 records initially
df = pd.read_csv(DATASET_PATH, nrows=5)

print("\n1. COLUMN NAMES")
print("-" * 40)

for column in df.columns:
    print(column)

print("\n2. DATA TYPES")
print("-" * 40)
print(df.dtypes)

print("\n3. FIRST 5 RECORDS")
print("-" * 40)
print(df.to_string(index=False))

print("\n4. MISSING VALUES IN SAMPLE")
print("-" * 40)
print(df.isnull().sum())

print("\n5. DATASET FILE SIZE")
print("-" * 40)

file_size = os.path.getsize(DATASET_PATH) / (1024 * 1024)

print(f"{file_size:.2f} MB")

print("\nINSPECTION COMPLETED!")
