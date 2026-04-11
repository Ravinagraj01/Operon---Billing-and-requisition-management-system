# backend/config.py

import os
from pathlib import Path

# Get the directory where this script is located
BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

print(f"Looking for .env at: {ENV_FILE}")
print(f"File exists: {ENV_FILE.exists()}")

# Load GROQ_API_KEY from .env file
GROQ_API_KEY = None

if ENV_FILE.exists():
    print("Reading .env file...")
    with open(ENV_FILE, 'r', encoding='utf-8-sig') as f:  # utf-8-sig handles BOM
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            print(f"Line {line_num}: '{line}' (repr: {repr(line)})")
            if line.startswith('GROQ_API_KEY='):
                GROQ_API_KEY = line.split('=', 1)[1].strip()
                print(f"Found GROQ_API_KEY: {GROQ_API_KEY[:10]}...")
                break
    print(f"GROQ_API_KEY loaded: {GROQ_API_KEY is not None}")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env file")
