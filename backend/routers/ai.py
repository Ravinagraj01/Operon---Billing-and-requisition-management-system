# backend/routers/ai.py

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_active_user
from models import User
from services.ai_assistant import process_requisition_input

router = APIRouter()


class AssistantInput(BaseModel):
    text: str = Field(
        ...,
        min_length=5,
        max_length=1000,
        description="Employee plain English description of what they need"
    )


class AssistantResponse(BaseModel):
    title: str
    category: str
    amount: Optional[float] = None
    vendor_suggestion: Optional[str] = None
    description: str
    confidence: str
    clarification_needed: Optional[str] = None


@router.post(
    "/assistant/requisition",
    response_model=AssistantResponse,
    summary="AI Requisition Assistant",
    description="Converts plain English input into a structured requisition form"
)
async def requisition_assistant(
    payload: AssistantInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # All roles can use the assistant
    try:
        print(f"AI assistant called with payload: {payload}")
        print(f"Current user: {current_user.email if current_user else 'None'}")
        print("Calling process_requisition_input...")
        result = await process_requisition_input(payload.text)
        print(f"AI processing completed, result keys: {list(result.keys()) if result else 'None'}")
        # Remove internal usage data before returning
        result.pop("_usage", None)

        return result

    except ValueError as e:
        print(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        import traceback
        print(f"AI assistant error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI assistant is temporarily unavailable. Please fill the form manually."
        )
