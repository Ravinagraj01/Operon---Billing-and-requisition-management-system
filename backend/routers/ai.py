# backend/routers/ai.py

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_active_user
from models import User
from services.ai_assistant import (
    process_requisition_input,          # already imported
    process_approval_recommendation,    # new
    process_budget_impact               # new
)

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


# ─────────────────────────────────────────────────────────────────
# ENDPOINT 2 — DEPT HEAD APPROVAL RECOMMENDATION
# ─────────────────────────────────────────────────────────────────

@router.post(
    "/assistant/approval-recommendation/{requisition_id}",
    summary="AI Approval Recommendation",
    description="Generates an approval recommendation for dept heads"
)
async def approval_recommendation(
    requisition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Only dept_head and admin can use this
    if current_user.role not in ["dept_head", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only department heads can access approval recommendations"
        )

    # Fetch the requisition
    from models import Requisition, Approval, Comment
    requisition = db.query(Requisition).filter(
        Requisition.id == requisition_id
    ).first()

    if not requisition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requisition not found"
        )

    # Check requisition is in a stage the dept head can act on
    if requisition.stage not in ["submitted", "dept_review"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recommendation only available for requisitions pending dept review"
        )

    # Build requisition dict for AI context
    creator_name = requisition.creator.full_name if requisition.creator else "Unknown"
    req_dict = {
        "req_id": requisition.req_id,
        "title": requisition.title,
        "description": requisition.description,
        "category": requisition.category,
        "amount": requisition.amount,
        "department": requisition.department,
        "vendor_suggestion": requisition.vendor_suggestion,
        "priority_score": requisition.priority_score,
        "created_by": creator_name
    }

    # Fetch similar requisitions in same dept last 90 days
    ninety_days_ago = datetime.utcnow() - timedelta(days=90)
    similar = db.query(Requisition).filter(
        Requisition.department == requisition.department,
        Requisition.category == requisition.category,
        Requisition.id != requisition_id,
        Requisition.created_at >= ninety_days_ago
    ).order_by(Requisition.created_at.desc()).limit(5).all()

    similar_list = [{
        "title": r.title,
        "amount": r.amount,
        "stage": r.stage
    } for r in similar]

    # Build department statistics
    from sqlalchemy import func

    quarter_start = datetime.utcnow() - timedelta(days=90)

    quarterly_approved = db.query(
        func.sum(Requisition.amount)
    ).filter(
        Requisition.department == requisition.department,
        Requisition.stage == "approved",
        Requisition.created_at >= quarter_start
    ).scalar() or 0

    avg_amount = db.query(
        func.avg(Requisition.amount)
    ).filter(
        Requisition.department == requisition.department,
        Requisition.stage == "approved"
    ).scalar() or 0

    pending_count = db.query(Requisition).filter(
        Requisition.department == requisition.department,
        Requisition.stage.in_(["submitted", "dept_review", "finance_review"])
    ).count()

    category_avg = db.query(
        func.avg(Requisition.amount)
    ).filter(
        Requisition.category == requisition.category,
        Requisition.stage == "approved"
    ).scalar() or 0

    dept_stats = {
        "quarterly_approved": float(quarterly_approved),
        "avg_amount": float(avg_amount),
        "pending_count": pending_count,
        "category_avg": float(category_avg)
    }

    try:
        result = await process_approval_recommendation(
            req_dict, similar_list, dept_stats
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"Approval recommendation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI recommendation unavailable. Please review manually."
        )


# ─────────────────────────────────────────────────────────────────
# ENDPOINT 3 — FINANCE BUDGET IMPACT ANALYSER
# ─────────────────────────────────────────────────────────────────

@router.post(
    "/assistant/budget-impact/{requisition_id}",
    summary="AI Budget Impact Analysis",
    description="Generates a budget impact analysis for finance reviewers"
)
async def budget_impact_analysis(
    requisition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Only finance and admin can use this
    if current_user.role not in ["finance", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only finance team can access budget impact analysis"
        )

    # Fetch the requisition
    from models import Requisition
    requisition = db.query(Requisition).filter(
        Requisition.id == requisition_id
    ).first()

    if not requisition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requisition not found"
        )

    # Check requisition is in finance review stage
    if requisition.stage not in ["finance_review", "procurement"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget analysis only available for requisitions in finance review"
        )

    # Build requisition dict
    req_dict = {
        "req_id": requisition.req_id,
        "title": requisition.title,
        "description": requisition.description,
        "category": requisition.category,
        "amount": requisition.amount,
        "department": requisition.department,
        "vendor_suggestion": requisition.vendor_suggestion
    }

    # Build department monthly spend history (last 6 months)
    from sqlalchemy import func, extract
    import pandas as pd

    six_months_ago = datetime.utcnow() - timedelta(days=180)

    monthly_spend_raw = db.query(
        func.strftime('%Y-%m', Requisition.created_at).label('month'),
        func.sum(Requisition.amount).label('total_amount'),
        func.count(Requisition.id).label('req_count')
    ).filter(
        Requisition.department == requisition.department,
        Requisition.stage == "approved",
        Requisition.created_at >= six_months_ago
    ).group_by(
        func.strftime('%Y-%m', Requisition.created_at)
    ).order_by('month').all()

    dept_spend_history = [{
        "month": row.month,
        "total_amount": float(row.total_amount),
        "req_count": row.req_count
    } for row in monthly_spend_raw]

    # Build category statistics
    quarter_start = datetime.utcnow() - timedelta(days=90)

    cat_stats = db.query(
        func.avg(Requisition.amount).label('avg_amount'),
        func.max(Requisition.amount).label('max_amount'),
        func.min(Requisition.amount).label('min_amount'),
        func.sum(Requisition.amount).label('quarterly_total'),
        func.count(Requisition.id).label('quarterly_count')
    ).filter(
        Requisition.category == requisition.category,
        Requisition.stage == "approved",
        Requisition.created_at >= quarter_start
    ).first()

    category_stats = {
        "avg_amount": float(cat_stats.avg_amount or 0),
        "max_amount": float(cat_stats.max_amount or 0),
        "min_amount": float(cat_stats.min_amount or 0),
        "quarterly_total": float(cat_stats.quarterly_total or 0),
        "quarterly_count": int(cat_stats.quarterly_count or 0)
    }

    # Build quarterly budget summary
    dept_approved = db.query(
        func.sum(Requisition.amount)
    ).filter(
        Requisition.department == requisition.department,
        Requisition.stage == "approved",
        Requisition.created_at >= quarter_start
    ).scalar() or 0

    dept_pending = db.query(
        func.sum(Requisition.amount)
    ).filter(
        Requisition.department == requisition.department,
        Requisition.stage.in_([
            "submitted", "dept_review",
            "finance_review", "procurement"
        ])
    ).scalar() or 0

    # Estimate quarterly budget from historical average
    historical_avg = db.query(
        func.avg(Requisition.amount)
    ).filter(
        Requisition.department == requisition.department,
        Requisition.stage == "approved"
    ).scalar() or 0
    estimated_quarterly = float(historical_avg) * 12

    quarterly_budget = {
        "approved_spend": float(dept_approved),
        "pending_spend": float(dept_pending),
        "estimated_budget": estimated_quarterly
    }

    try:
        result = await process_budget_impact(
            req_dict,
            dept_spend_history,
            category_stats,
            quarterly_budget
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"Budget impact error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI analysis unavailable. Please review manually."
        )
