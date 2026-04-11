# backend/services/ai_assistant.py

import json
import re
from openai import AsyncOpenAI
from config import GROQ_API_KEY

client = AsyncOpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

# Valid categories that match the frontend form exactly
VALID_CATEGORIES = [
    "IT", "HR", "Finance", "Legal",
    "Operations", "Marketing", "Security", "Other"
]


def build_system_prompt():
    return """
You are a procurement assistant for an enterprise requisition
management system called Procura.

Your job is to read an employee's natural language description
of what they need and convert it into a structured, professional
requisition form.

You must always return a valid JSON object and nothing else.
No explanation. No markdown. No code blocks. Just raw JSON.

The JSON must have exactly these fields:
{
  "title": "string — professional, specific, max 80 characters",
  "category": "one of: IT, HR, Finance, Legal, Operations, Marketing, Security, Other",
  "amount": number or null — total estimated amount in INR,
  "vendor_suggestion": "string or null — specific vendor name if mentioned or inferable",
  "description": "string — 2 to 3 sentences, professional tone, explains what is needed, why, and any specifications",
  "confidence": "high or medium or low — how confident you are in the extracted details",
  "clarification_needed": "string or null — if something critical is missing or ambiguous, ask one specific question"
}

Rules you must follow:
1. Title must be specific and professional. Not vague like 'Laptop Purchase'. Good example: 'Dell Laptop Procurement — Developer Onboarding Batch (3 Units)'
2. Category must be exactly one of the valid options listed above
3. Amount must be in INR as a plain number. If employee says 80k, return 80000. If they give per-unit price and quantity, calculate the total. If no amount is mentioned, return null
4. Vendor suggestion should only be filled if a specific vendor is mentioned or strongly implied. Do not guess randomly
5. Description must be written in third person professional tone as if a procurement officer wrote it
6. If the input is too vague to extract a meaningful requisition, set confidence to low and ask a clarification question
7. Never make up critical details like amounts or quantities that were not mentioned or inferable
"""


def build_few_shot_examples():
    return [
        {
            "role": "user",
            "content": "i need new laptops for 3 developers joining next month, around 80k each, prefer dell"
        },
        {
            "role": "assistant",
            "content": json.dumps({
                "title": "Dell Laptop Procurement — Developer Onboarding Batch (3 Units)",
                "category": "IT",
                "amount": 240000,
                "vendor_suggestion": "Dell India",
                "description": "Procurement of 3 Dell laptops required for new developer hires joining next month. Each unit estimated at INR 80,000. Laptops are required for development environment setup, coding workflows, and onboarding processes.",
                "confidence": "high",
                "clarification_needed": None
            })
        },
        {
            "role": "user",
            "content": "we need to hire a legal consultant for reviewing our vendor contracts"
        },
        {
            "role": "assistant",
            "content": json.dumps({
                "title": "Legal Consultation Services — Vendor Contract Review",
                "category": "Legal",
                "amount": None,
                "vendor_suggestion": None,
                "description": "Engagement of an external legal consultant to review and validate vendor contracts for compliance and risk assessment. Scope includes review of existing agreements and recommendations for amendments where necessary.",
                "confidence": "medium",
                "clarification_needed": "What is the estimated budget or expected number of hours for the legal consultation?"
            })
        },
        {
            "role": "user",
            "content": "need stuff for the office"
        },
        {
            "role": "assistant",
            "content": json.dumps({
                "title": "Office Supplies Procurement",
                "category": "Operations",
                "amount": None,
                "vendor_suggestion": None,
                "description": "Procurement of general office supplies as required for daily operations.",
                "confidence": "low",
                "clarification_needed": "Could you specify what office supplies are needed, the quantity, and an estimated budget?"
            })
        }
    ]


def extract_json_from_response(text: str) -> dict:
    """
    Safely extract JSON from model response.
    Handles cases where model wraps response in markdown code blocks.
    """
    # Remove markdown code blocks if present
    text = text.strip()
    text = re.sub(r'^```json\s*', '', text)
    text = re.sub(r'^```\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Model returned invalid JSON: {e}. Raw response: {text}")


def validate_and_clean_response(data: dict) -> dict:
    """
    Validate the extracted fields and clean them up.
    Ensures the response matches what the frontend expects.
    """
    # Validate category
    if data.get("category") not in VALID_CATEGORIES:
        data["category"] = "Other"

    # Ensure amount is positive number or None
    if data.get("amount") is not None:
        try:
            data["amount"] = max(0, float(data["amount"]))
        except (ValueError, TypeError):
            data["amount"] = None

    # Ensure title is not empty
    if not data.get("title") or len(data["title"].strip()) == 0:
        data["title"] = "New Requisition"

    # Trim title to 80 chars
    if len(data.get("title", "")) > 80:
        data["title"] = data["title"][:77] + "..."

    # Ensure confidence is valid
    if data.get("confidence") not in ["high", "medium", "low"]:
        data["confidence"] = "medium"

    # Clean up None strings
    if data.get("vendor_suggestion") in ["null", "none", "None", ""]:
        data["vendor_suggestion"] = None

    if data.get("clarification_needed") in ["null", "none", "None", ""]:
        data["clarification_needed"] = None

    return data


async def process_requisition_input(user_input: str) -> dict:
    """
    Main function — takes employee's plain English input,
    calls OpenAI, returns structured requisition data.
    """
    if not user_input or len(user_input.strip()) < 5:
        raise ValueError("Input is too short to process")

    if len(user_input) > 1000:
        user_input = user_input[:1000]

    messages = [
        {"role": "system", "content": build_system_prompt()},
        *build_few_shot_examples(),
        {"role": "user", "content": user_input.strip()}
    ]

    print(f"Calling Groq API with input: {user_input[:100]}...")
    response = await client.chat.completions.create(
        model="llama3-70b-8192",  # Groq model
        messages=messages,
        temperature=0.1,
        max_tokens=600,
        # response_format={"type": "json_object"}  # Groq may not support this
    )
    print("Groq API call completed")
    raw_text = response.choices[0].message.content
    print(f"Raw response: {raw_text[:200]}...")
    parsed = extract_json_from_response(raw_text)
    cleaned = validate_and_clean_response(parsed)

    # Add usage info for monitoring
    cleaned["_usage"] = {
        "prompt_tokens": response.usage.prompt_tokens,
        "completion_tokens": response.usage.completion_tokens,
        "total_tokens": response.usage.total_tokens
    }

    return cleaned
    """
    Build the complete prompt for Gemini.
    Gemini works best with a single well-structured prompt
    rather than a system + user message format.
    """
    return f"""
You are a procurement assistant for an enterprise requisition
management system called Procura.

Your job is to read an employee's natural language description
of what they need and convert it into a structured, professional
requisition form.

You must always return a valid JSON object and absolutely nothing
else. No explanation. No markdown. No code blocks. No preamble.
Just the raw JSON object starting with {{ and ending with }}.

The JSON must have exactly these fields:
{{
  "title": "string — professional, specific, max 80 characters",
  "category": "must be exactly one of: IT, HR, Finance, Legal, Operations, Marketing, Security, Other",
  "amount": number or null — total estimated amount in INR as a plain number,
  "vendor_suggestion": "string or null — specific vendor name if mentioned or strongly implied",
  "description": "string — 2 to 3 sentences, professional tone, third person, explains what is needed why and any specifications",
  "confidence": "must be exactly one of: high, medium, low",
  "clarification_needed": "string or null — if something critical is missing ask one specific question, otherwise null"
}}

Rules you must follow without exception:
1. Title must be specific and professional. Bad: 'Laptop Purchase'. Good: 'Dell Laptop Procurement — Developer Onboarding Batch (3 Units)'
2. Category must be exactly one of the 8 valid options. No other value is accepted
3. Amount must be in INR as a plain number with no currency symbol or commas. If employee says 80k return 80000. If they give per unit price and quantity multiply them for total. If no amount mentioned return null
4. Vendor suggestion only if a specific vendor is mentioned or strongly implied. Do not guess randomly
5. Description must sound like it was written by a professional procurement officer
6. If input is too vague to extract a meaningful requisition set confidence to low and ask one specific clarification question
7. Never invent amounts or quantities that were not mentioned or clearly inferable
8. Return raw JSON only — no markdown, no backticks, no explanation text

Here are examples of correct input and output:

Example 1:
Input: "i need new laptops for 3 developers joining next month, around 80k each, prefer dell"
Output: {{"title": "Dell Laptop Procurement — Developer Onboarding Batch (3 Units)", "category": "IT", "amount": 240000, "vendor_suggestion": "Dell India", "description": "Procurement of 3 Dell laptops required for new developer hires joining next month. Each unit is estimated at INR 80,000. Laptops are required for development environment setup, coding workflows, and standard onboarding processes.", "confidence": "high", "clarification_needed": null}}

Example 2:
Input: "we need to hire a legal consultant for reviewing our vendor contracts"
Output: {{"title": "Legal Consultation Services — Vendor Contract Review", "category": "Legal", "amount": null, "vendor_suggestion": null, "description": "Engagement of an external legal consultant to review and validate vendor contracts for compliance and risk assessment. Scope includes review of existing agreements and recommendations for amendments where necessary.", "confidence": "medium", "clarification_needed": "What is the estimated budget or expected number of hours for the legal consultation?"}}

Example 3:
Input: "need stuff for the office"
Output: {{"title": "Office Supplies Procurement", "category": "Operations", "amount": null, "vendor_suggestion": null, "description": "Procurement of general office supplies as required for daily operational needs.", "confidence": "low", "clarification_needed": "Could you specify what office supplies are needed, the quantity required, and an estimated budget?"}}

Example 4:
Input: "annual figma subscription for the design team of 6 people"
Output: {{"title": "Figma Annual Subscription — Design Team (6 Seats)", "category": "IT", "amount": null, "vendor_suggestion": "Figma", "description": "Procurement of an annual Figma subscription covering 6 seats for the design team. Required for UI/UX design workflows, prototyping, and design collaboration across the team.", "confidence": "medium", "clarification_needed": "What is the per-seat or total annual cost for the Figma subscription?"}}

Now process this input and return only the JSON:
Input: "{user_input}"
Output:"""


def extract_json_from_response(text: str) -> dict:
    """
    Safely extract JSON from Gemini response.
    Handles cases where model wraps response in markdown
    despite instructions not to.
    """
    text = text.strip()

    # Remove markdown code blocks if present
    text = re.sub(r'^```json\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'^```\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)
    text = text.strip()

    # Find JSON object in the response
    # Sometimes Gemini adds text before or after the JSON
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        text = json_match.group()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Model returned invalid JSON: {e}. "
            f"Raw response: {text[:200]}"
        )


def validate_and_clean_response(data: dict) -> dict:
    """
    Validate extracted fields and clean them.
    Ensures the response matches exactly what the frontend expects.
    """
    # Validate category
    if data.get("category") not in VALID_CATEGORIES:
        data["category"] = "Other"

    # Ensure amount is a positive number or None
    if data.get("amount") is not None:
        try:
            amount = float(str(data["amount"]).replace(",", ""))
            data["amount"] = max(0, amount)
        except (ValueError, TypeError):
            data["amount"] = None

    # Ensure title exists and is not empty
    if not data.get("title") or len(str(data["title"]).strip()) == 0:
        data["title"] = "New Requisition"

    # Trim title to 80 characters
    if len(str(data.get("title", ""))) > 80:
        data["title"] = data["title"][:77] + "..."

    # Ensure confidence is valid
    if data.get("confidence") not in ["high", "medium", "low"]:
        data["confidence"] = "medium"

    # Clean up null-like strings from vendor and clarification fields
    for field in ["vendor_suggestion", "clarification_needed"]:
        if data.get(field) in ["null", "none", "None", "NULL", "", "N/A"]:
            data[field] = None

    # Ensure description exists
    if not data.get("description"):
        data["description"] = ""

    return data


async def process_requisition_input(user_input: str) -> dict:
    """
    Main function called by the API endpoint.
    Takes employee plain English input, calls Groq,
    returns structured requisition data.
    """
    if not GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY not configured. Please add it to your environment variables or .env file."
        )

    if not user_input or len(user_input.strip()) < 5:
        raise ValueError("Input is too short to process")

    # Trim input to safe length
    user_input = user_input.strip()[:1000]

    # Build the messages for the chat API
    messages = [
        {"role": "system", "content": build_system_prompt()},
        *build_few_shot_examples(),
        {"role": "user", "content": user_input}
    ]

    print(f"Calling Groq API with input: {user_input[:100]}...")
    response = await client.chat.completions.create(
        model="llama-3.1-8b-instant",  # Updated to current Groq model
        messages=messages,
        max_tokens=600,
        # response_format={"type": "json_object"}  # Groq may not support this
    )
    print("Groq API call completed")
    raw_text = response.choices[0].message.content
    print(f"Raw response: {raw_text[:200]}...")

    if not raw_text:
        raise ValueError("Groq returned an empty response")

    # Parse and validate
    parsed = extract_json_from_response(raw_text)
    cleaned = validate_and_clean_response(parsed)

    return cleaned
