
from gemini_service import generate_ai_response

prompt = """
You are the AI Career Advisor for JobScope.

Explain in 5 short bullet points why SQL is important
for someone pursuing a Data Engineering career.
"""

try:
    result = generate_ai_response(prompt)

    print("\n========== JOBSCOPE AI RESPONSE ==========\n")
    print(result)
    print("\n===========================================\n")

except Exception as error:
    print("Gemini service test failed:")
    print(error)
