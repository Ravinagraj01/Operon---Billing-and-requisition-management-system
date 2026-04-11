import os
from pathlib import Path

# Load API key like config.py does
BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

GROQ_API_KEY = None

if ENV_FILE.exists():
    with open(ENV_FILE, 'r', encoding='utf-8-sig') as f:
        for line in f:
            line = line.strip()
            if line.startswith('GROQ_API_KEY='):
                GROQ_API_KEY = line.split('=', 1)[1].strip()
                break

if not GROQ_API_KEY:
    print("API key not found in .env")
    exit(1)

print(f"API key loaded: {GROQ_API_KEY[:10]}...")

# Test Groq API
from openai import OpenAI

client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

try:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": "Say hello"}],
        max_tokens=10
    )
    print("API call successful!")
    print(f"Response: {response.choices[0].message.content}")
except Exception as e:
    print(f"API call failed: {e}")