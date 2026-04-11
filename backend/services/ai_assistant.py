# backend/services/ai_assistant.py

import json
import re
from openai import AsyncOpenAI
from config import GROQ_API_KEY

client = AsyncOpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

MODEL_NAME = "llama-3.1-8b-instant"

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


# ─────────────────────────────────────────────────────────────────
# FEATURE 2 — DEPT HEAD: APPROVAL DECISION ASSISTANT
# ─────────────────────────────────────────────────────────────────

def build_approval_system_prompt():
    return """
You are a senior procurement advisor for an enterprise
requisition management system called Procura.

Your job is to help department heads make fast, informed
approval decisions on requisitions submitted by their team.

You will be given details about a requisition and historical
context about similar past requests. Analyse the information
and provide a clear recommendation.

You must always return a valid JSON object and nothing else.
No explanation. No markdown. No code blocks. Just raw JSON.

The JSON must have exactly these fields:
{
  "recommendation": "approve or review_carefully",
  "recommendation_label": "Approve" or "Review Carefully",
  "confidence": "high or medium or low",
  "reason": "string — 2 to 3 sentences explaining why you recommend this action based on the data provided",
  "risk_factors": ["array of short strings — each a specific risk or concern, empty array if none"],
  "positive_factors": ["array of short strings — each a positive signal, empty array if none"],
  "suggested_comment": "string — a professional comment the dept head can use when approving or returning the requisition. Should be 1 to 2 sentences, formal tone"
}

Rules:
1. Recommend approve if: amount is reasonable for the category, no strong red flags, aligns with typical department spend
2. Recommend review_carefully if: amount is significantly higher than historical average, vendor is unverified, description is vague, or amount exceeds typical thresholds
3. The suggested comment must be usable as-is — professional, specific, not generic
4. Risk factors and positive factors must each be short — under 10 words each
5. Return raw JSON only — no extra text
"""


def build_approval_context(
    requisition: dict,
    similar_requisitions: list,
    dept_stats: dict
) -> str:
    similar_text = ""
    if similar_requisitions:
        similar_text = "\n".join([
            f"- {r['title']}: INR {r['amount']:,.0f} ({r['stage']})"
            for r in similar_requisitions[:5]
        ])
    else:
        similar_text = "No similar requisitions found in the past 90 days"

    return f"""
Requisition Details:
- ID: {requisition['req_id']}
- Title: {requisition['title']}
- Description: {requisition.get('description') or 'Not provided'}
- Category: {requisition['category']}
- Amount: INR {requisition['amount']:,.0f}
- Department: {requisition['department']}
- Vendor Suggested: {requisition.get('vendor_suggestion') or 'None specified'}
- Priority Score: {requisition['priority_score']} out of 10
- Submitted by: {requisition['created_by']}

Similar Requisitions in This Department (Last 90 Days):
{similar_text}

Department Statistics:
- Total approved spend this quarter: INR {dept_stats.get('quarterly_approved', 0):,.0f}
- Average requisition amount in this department: INR {dept_stats.get('avg_amount', 0):,.0f}
- Total pending requisitions in department: {dept_stats.get('pending_count', 0)}
- Category average amount for {requisition['category']}: INR {dept_stats.get('category_avg', 0):,.0f}

Based on this information, provide your approval recommendation.
"""


async def process_approval_recommendation(
    requisition: dict,
    similar_requisitions: list,
    dept_stats: dict
) -> dict:
    """
    Generates an approval recommendation for dept heads.
    Takes requisition data and historical context,
    returns structured recommendation.
    """
    system_prompt = build_approval_system_prompt()
    context = build_approval_context(
        requisition, similar_requisitions, dept_stats
    )

    response = await client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": context}
        ],
        temperature=0.2,
        max_tokens=700,
        response_format={"type": "json_object"}
    )

    raw_text = response.choices[0].message.content

    if not raw_text:
        raise ValueError("Model returned empty response")

    parsed = extract_json_from_response(raw_text)

    # Validate recommendation field
    if parsed.get("recommendation") not in ["approve", "review_carefully"]:
        parsed["recommendation"] = "review_carefully"
        parsed["recommendation_label"] = "Review Carefully"

    # Ensure arrays exist
    if not isinstance(parsed.get("risk_factors"), list):
        parsed["risk_factors"] = []
    if not isinstance(parsed.get("positive_factors"), list):
        parsed["positive_factors"] = []

    # Validate confidence
    if parsed.get("confidence") not in ["high", "medium", "low"]:
        parsed["confidence"] = "medium"

    return parsed


# ─────────────────────────────────────────────────────────────────
# FEATURE 3 — FINANCE: BUDGET IMPACT ANALYSER
# ─────────────────────────────────────────────────────────────────

def build_finance_system_prompt():
    return """
You are a senior financial analyst for an enterprise
requisition management system called Procura.

Your job is to analyse the budget impact of a requisition
and help the finance team make a fast, informed decision.

You will be given the requisition details, department spend
history, and category averages. Analyse and provide a
structured budget impact report.

You must always return a valid JSON object and nothing else.
No explanation. No markdown. No code blocks. Just raw JSON.

The JSON must have exactly these fields:
{
  "risk_level": "low or medium or high",
  "risk_label": "Low Risk" or "Medium Risk" or "High Risk",
  "summary": "string — 2 to 3 sentences summarising the budget impact in plain English for a finance reviewer",
  "historical_context": "string — 1 to 2 sentences comparing this request to historical data",
  "budget_impact_percent": number — what percentage of quarterly budget this request represents, rounded to 1 decimal,
  "is_above_category_average": true or false,
  "deviation_percent": number — how many percent above or below the category average this amount is, positive means above,
  "flags": ["array of short specific financial concerns, empty array if none"],
  "suggested_finance_note": "string — a professional note the finance reviewer can attach to their approval. 1 to 2 sentences, formal tone, mentions key financial considerations"
}

Risk level rules:
- low: amount is within or below category average, department has budget headroom, no unusual patterns
- medium: amount is 20 to 50 percent above category average, or department spend is trending high
- high: amount is more than 50 percent above category average, or department is near budget limit

Rules:
1. Be precise with numbers — use the data provided
2. Flags must be specific — not generic statements like 'high amount'
3. Suggested finance note must sound like it was written by a CFO
4. Return raw JSON only
"""


def build_finance_context(
    requisition: dict,
    dept_spend_history: list,
    category_stats: dict,
    quarterly_budget: dict
) -> str:
    spend_history_text = ""
    if dept_spend_history:
        spend_history_text = "\n".join([
            f"- {item['month']}: INR {item['total_amount']:,.0f} "
            f"({item['req_count']} requisitions)"
            for item in dept_spend_history
        ])
    else:
        spend_history_text = "No historical spend data available"

    return f"""
Requisition Details:
- ID: {requisition['req_id']}
- Title: {requisition['title']}
- Category: {requisition['category']}
- Amount Requested: INR {requisition['amount']:,.0f}
- Department: {requisition['department']}
- Vendor: {requisition.get('vendor_suggestion') or 'Not specified'}
- Description: {requisition.get('description') or 'Not provided'}

Department Monthly Spend History (Last 6 Months):
{spend_history_text}

Category Statistics for {requisition['category']}:
- Average approved amount: INR {category_stats.get('avg_amount', 0):,.0f}
- Highest approved amount: INR {category_stats.get('max_amount', 0):,.0f}
- Lowest approved amount: INR {category_stats.get('min_amount', 0):,.0f}
- Total approved this quarter: INR {category_stats.get('quarterly_total', 0):,.0f}
- Number of approvals this quarter: {category_stats.get('quarterly_count', 0)}

Department Budget Summary:
- Total approved spend this quarter: INR {quarterly_budget.get('approved_spend', 0):,.0f}
- Total pending spend (if all approved): INR {quarterly_budget.get('pending_spend', 0):,.0f}
- Estimated quarterly budget (based on historical avg): INR {quarterly_budget.get('estimated_budget', 0):,.0f}

Provide a full budget impact analysis for the finance reviewer.
"""


async def process_budget_impact(
    requisition: dict,
    dept_spend_history: list,
    category_stats: dict,
    quarterly_budget: dict
) -> dict:
    """
    Generates a budget impact analysis for finance team.
    Takes requisition + financial context,
    returns structured analysis.
    """
    system_prompt = build_finance_system_prompt()
    context = build_finance_context(
        requisition,
        dept_spend_history,
        category_stats,
        quarterly_budget
    )

    response = await client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": context}
        ],
        temperature=0.2,
        max_tokens=700,
        response_format={"type": "json_object"}
    )

    raw_text = response.choices[0].message.content

    if not raw_text:
        raise ValueError("Model returned empty response")

    parsed = extract_json_from_response(raw_text)

    # Validate risk level
    if parsed.get("risk_level") not in ["low", "medium", "high"]:
        parsed["risk_level"] = "medium"
        parsed["risk_label"] = "Medium Risk"

    # Ensure arrays exist
    if not isinstance(parsed.get("flags"), list):
        parsed["flags"] = []

    # Ensure numbers are valid
    for field in ["budget_impact_percent", "deviation_percent"]:
        try:
            parsed[field] = round(float(parsed.get(field, 0)), 1)
        except (ValueError, TypeError):
            parsed[field] = 0.0

    return parsed


# ─────────────────────────────────────────────────────────────────
# FEATURE 4 — ADMIN: BOTTLENECK DETECTOR
# ─────────────────────────────────────────────────────────────────

def build_bottleneck_system_prompt():
    return """
You are a senior operations analyst for an enterprise
requisition management system called Procura.

Your job is to analyse the current state of the requisition
pipeline and identify bottlenecks — places where requests
are getting stuck, delayed, or accumulating.

You will be given live pipeline data including stage counts,
SLA breaches, department breakdowns, and timing information.

You must always return a valid JSON object and nothing else.
No explanation. No markdown. No code blocks. Just raw JSON.

The JSON must have exactly this structure:
{
  "overall_health": "healthy or warning or critical",
  "health_label": "Pipeline Healthy" or "Attention Needed" or "Critical Issues Detected",
  "health_reason": "string — one sentence summarising the overall pipeline health",
  "bottlenecks": [
    {
      "id": "unique short string like bottleneck_1",
      "severity": "low or medium or high",
      "title": "string — short title of the bottleneck, max 60 characters",
      "description": "string — 2 sentences explaining what the bottleneck is and why it is happening",
      "affected_count": number — how many requisitions are affected,
      "affected_value": number — total INR value of affected requisitions,
      "likely_cause": "string — 1 sentence on the most probable root cause",
      "recommended_action": "string — 1 specific actionable step the admin should take right now",
      "stage": "string — which pipeline stage this bottleneck is in"
    }
  ],
  "quick_wins": ["array of short strings — small immediate actions that would improve pipeline flow, max 3 items"],
  "summary_stats": {
    "total_stuck": number — total requisitions currently stuck or delayed,
    "total_stuck_value": number — total INR value of stuck requisitions,
    "most_congested_stage": "string — name of the stage with most items",
    "oldest_pending_days": number — age in days of the oldest pending requisition
  }
}

Rules:
1. Only report real bottlenecks — do not invent problems that are not in the data
2. If the pipeline is healthy with no issues return an empty bottlenecks array and healthy overall_health
3. Severity rules: high if SLA breached or more than 5 items stuck in one stage, medium if 3 to 5 items or close to SLA, low if 1 to 2 items with minor delays
4. Recommended action must be specific and immediately actionable — not generic advice
5. Quick wins must be concrete and doable in under 10 minutes
6. Return raw JSON only — no extra text whatsoever
"""


def build_bottleneck_context(pipeline_data: dict) -> str:
    """
    Converts live pipeline data from the database
    into a structured text context for the AI model.
    """

    # Format stage breakdown
    stage_lines = "\n".join([
        f"  - {stage}: {info['count']} requisitions "
        f"(total value: INR {info['total_value']:,.0f}, "
        f"avg age: {info['avg_age_hours']:.1f} hours)"
        for stage, info in pipeline_data["stage_breakdown"].items()
        if info["count"] > 0
    ])

    # Format SLA breaches
    if pipeline_data["sla_breaches"]:
        sla_lines = "\n".join([
            f"  - {b['req_id']}: {b['title']} | "
            f"Department: {b['department']} | "
            f"Stage: {b['stage']} | "
            f"Amount: INR {b['amount']:,.0f} | "
            f"Days overdue: {b['days_overdue']:.1f}"
            for b in pipeline_data["sla_breaches"]
        ])
    else:
        sla_lines = "  None — all requisitions within SLA window"

    # Format department congestion
    dept_lines = "\n".join([
        f"  - {dept}: {info['pending_count']} pending "
        f"(INR {info['pending_value']:,.0f})"
        for dept, info in pipeline_data["dept_congestion"].items()
        if info["pending_count"] > 0
    ])

    # Format oldest pending items
    if pipeline_data["oldest_pending"]:
        oldest_lines = "\n".join([
            f"  - {item['req_id']}: {item['title']} | "
            f"Stage: {item['stage']} | "
            f"Age: {item['age_days']:.1f} days | "
            f"Amount: INR {item['amount']:,.0f}"
            for item in pipeline_data["oldest_pending"][:5]
        ])
    else:
        oldest_lines = "  No pending items"

    return f"""
Current Pipeline State — Live Data
Generated at: {pipeline_data['generated_at']}

OVERALL PIPELINE SUMMARY:
- Total active requisitions (non-draft, non-closed): {pipeline_data['total_active']}
- Total pipeline value: INR {pipeline_data['total_pipeline_value']:,.0f}
- Total SLA breaches: {pipeline_data['total_sla_breaches']}
- Total items pending more than 48 hours: {pipeline_data['items_over_48h']}
- Average time in current stage: {pipeline_data['avg_stage_hours']:.1f} hours

STAGE BREAKDOWN:
{stage_lines if stage_lines else "  No active items in pipeline"}

SLA BREACHES (past 48-hour window):
{sla_lines}

DEPARTMENT CONGESTION:
{dept_lines if dept_lines else "  No department congestion detected"}

OLDEST PENDING REQUISITIONS:
{oldest_lines}

HIGH VALUE ITEMS PENDING (above INR 100,000):
- Count: {pipeline_data['high_value_pending_count']}
- Total value: INR {pipeline_data['high_value_pending_value']:,.0f}

Analyse this pipeline data and identify all bottlenecks.
Return only the JSON response.
"""


def process_bottleneck_detection(pipeline_data: dict) -> dict:
    """
    Main function for bottleneck detection.
    Takes live pipeline data dict,
    calls Groq, returns structured bottleneck analysis.
    """
    system_prompt = build_bottleneck_system_prompt()
    context = build_bottleneck_context(pipeline_data)

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": context}
        ],
        temperature=0.2,
        max_tokens=1200,
        response_format={"type": "json_object"}
    )

    raw_text = response.choices[0].message.content

    if not raw_text:
        raise ValueError("Model returned empty response")

    parsed = extract_json_from_response(raw_text)

    # Validate overall_health
    if parsed.get("overall_health") not in [
        "healthy", "warning", "critical"
    ]:
        parsed["overall_health"] = "warning"
        parsed["health_label"] = "Attention Needed"

    # Ensure bottlenecks is a list
    if not isinstance(parsed.get("bottlenecks"), list):
        parsed["bottlenecks"] = []

    # Validate each bottleneck severity
    for b in parsed["bottlenecks"]:
        if b.get("severity") not in ["low", "medium", "high"]:
            b["severity"] = "medium"
        if not isinstance(b.get("affected_count"), (int, float)):
            b["affected_count"] = 0
        if not isinstance(b.get("affected_value"), (int, float)):
            b["affected_value"] = 0

    # Ensure quick_wins is a list
    if not isinstance(parsed.get("quick_wins"), list):
        parsed["quick_wins"] = []

    # Cap quick wins to 3
    parsed["quick_wins"] = parsed["quick_wins"][:3]

    # Ensure summary_stats exists
    if not isinstance(parsed.get("summary_stats"), dict):
        parsed["summary_stats"] = {
            "total_stuck": 0,
            "total_stuck_value": 0,
            "most_congested_stage": "None",
            "oldest_pending_days": 0
        }

    return parsed
