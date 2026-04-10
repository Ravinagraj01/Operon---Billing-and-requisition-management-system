from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from database import get_db
from models import User, Requisition, Approval
from schemas import DashboardStats, DashboardRequisitionSummary
from auth import get_current_active_user
from datetime import datetime

router = APIRouter(tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Base query for requisitions visible to current user based on role
    if current_user.role == "employee":
        base_query = db.query(Requisition).filter(Requisition.created_by_id == current_user.id)
    elif current_user.role == "dept_head":
        base_query = db.query(Requisition).filter(Requisition.department == current_user.department)
    elif current_user.role == "finance":
        base_query = db.query(Requisition).outerjoin(Approval).filter(
            or_(
                Requisition.stage == "finance_review",
                and_(Approval.stage == "finance_review", Approval.approver_id == current_user.id)
            )
        ).distinct()
    else:  # admin
        base_query = db.query(Requisition)
    
    # Total requisitions
    total_requisitions = base_query.count()
    
    # Pipeline value (sum of amount for non-rejected requisitions)
    pipeline_value = base_query.filter(
        Requisition.stage != "rejected"
    ).with_entities(func.coalesce(func.sum(Requisition.amount), 0)).scalar()
    
    # Pending approvals (requisitions waiting for current user's role)
    if current_user.role in ["dept_head", "finance", "admin"]:
        stage_map = {
            "dept_head": ["dept_review"],
            "finance": ["finance_review"],
            "admin": ["procurement"]
        }
        pending_stages = stage_map.get(current_user.role, [])
        
        if current_user.role == "dept_head":
            pending_query = db.query(Requisition).filter(
                and_(
                    Requisition.stage.in_(pending_stages),
                    Requisition.department == current_user.department
                )
            )
        else:
            pending_query = db.query(Requisition).filter(
                Requisition.stage.in_(pending_stages)
            )
        
        pending_approvals = pending_query.count()
    else:
        pending_approvals = 0
    
    # Approved value
    approved_value = base_query.filter(
        Requisition.stage == "approved"
    ).with_entities(func.coalesce(func.sum(Requisition.amount), 0)).scalar()
    
    # Average approval time
    approved_requisitions = base_query.filter(Requisition.stage == "approved").all()
    if approved_requisitions:
        approval_times = []
        for req in approved_requisitions:
            # Get the latest approval for this requisition
            latest_approval = db.query(Approval).filter(
                Approval.requisition_id == req.id
            ).order_by(Approval.acted_at.desc()).first()
            
            if latest_approval:
                time_diff = latest_approval.acted_at - req.created_at
                hours = time_diff.total_seconds() / 3600
                approval_times.append(hours)
        
        avg_approval_time_hours = sum(approval_times) / len(approval_times) if approval_times else 0
    else:
        avg_approval_time_hours = 0
    
    # Spend by department
    spend_by_department = {}
    dept_spend = base_query.filter(Requisition.stage == "approved").with_entities(
        Requisition.department,
        func.coalesce(func.sum(Requisition.amount), 0)
    ).group_by(Requisition.department).all()
    
    for dept, amount in dept_spend:
        spend_by_department[dept] = float(amount)
    
    # Stage counts
    stage_counts = {}
    stage_counts_query = base_query.with_entities(
        Requisition.stage,
        func.count(Requisition.id)
    ).group_by(Requisition.stage).all()
    
    for stage, count in stage_counts_query:
        stage_counts[stage] = count
    
    latest_requisition = None
    latest_req = base_query.order_by(Requisition.updated_at.desc()).first()
    if latest_req:
        latest_requisition = {
            'id': latest_req.id,
            'req_id': latest_req.req_id,
            'title': latest_req.title,
            'stage': latest_req.stage,
            'amount': float(latest_req.amount),
            'department': latest_req.department,
            'created_at': latest_req.created_at,
            'updated_at': latest_req.updated_at
        }

    # SLA breached: count overdue open requisitions plus any completed after deadline
    now = datetime.utcnow()
    open_overdue_count = base_query.filter(
        and_(
            Requisition.sla_deadline < now,
            Requisition.stage.notin_(['approved', 'rejected'])
        )
    ).count()

    completed_reqs = base_query.filter(Requisition.stage.in_(['approved', 'rejected'])).all()
    completed_late_count = 0
    for req in completed_reqs:
        if not req.sla_deadline:
            continue
        latest_approval = db.query(Approval).filter(
            Approval.requisition_id == req.id
        ).order_by(Approval.acted_at.desc()).first()
        if latest_approval and latest_approval.acted_at > req.sla_deadline:
            completed_late_count += 1

    sla_breached = open_overdue_count + completed_late_count
    
    return DashboardStats(
        total_requisitions=total_requisitions,
        pipeline_value=float(pipeline_value),
        pending_approvals=pending_approvals,
        approved_value=float(approved_value),
        avg_approval_time_hours=round(avg_approval_time_hours, 2),
        spend_by_department=spend_by_department,
        stage_counts=stage_counts,
        sla_breached=sla_breached,
        latest_requisition=latest_requisition
    )
