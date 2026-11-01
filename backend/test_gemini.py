
import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

api_key = os.getenv("GEMINI_API_KEY")
model = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")

if not api_key:
    raise ValueError("GEMINI_API_KEY is missing from backend/.env")

client = genai.Client(api_key=api_key)

try:
    response = client.models.generate_content(
        model=model,
        contents="Reply with exactly: JobScope Gemini connection successful."
    )

    print(response.text)

except Exception as error:
    print("Gemini API connection failed:")
    print(error)
