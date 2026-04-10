from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Requisition, Approval, Notification
from schemas import ApprovalCreate, ApprovalOut
from auth import get_current_active_user

router = APIRouter(tags=["Approvals"])

STAGE_PROGRESSION = {
    "submitted": "dept_review",
    "dept_review": "finance_review",
    "finance_review": "procurement",
    "procurement": "approved"
}

STAGE_ROLE_MAP = {
    "submitted": "dept_head",
    "dept_review": "dept_head",
    "finance_review": "finance",
    "procurement": "admin"
}

@router.post("/{requisition_id}", response_model=ApprovalOut)
def create_approval(
    requisition_id: int,
    approval_data: ApprovalCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Fetch requisition
    requisition = db.query(Requisition).filter(Requisition.id == requisition_id).first()
    if not requisition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requisition not found"
        )
    
    # Check that current stage is valid for approval
    if requisition.stage in ["approved", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot act on requisition in current stage"
        )
    
    # Check that current user's role matches STAGE_ROLE_MAP for current stage
    required_role = STAGE_ROLE_MAP.get(requisition.stage)
    if current_user.role != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only {required_role} can approve at {requisition.stage} stage"
        )
    
    # Create Approval record
    approval = Approval(
        requisition_id=requisition_id,
        approver_id=current_user.id,
        stage=requisition.stage,
        action=approval_data.action,
        comment=approval_data.comment
    )
    
    db.add(approval)
    
    # Handle different actions
    if approval_data.action == "approved":
        # Move stage to next
        next_stage = STAGE_PROGRESSION.get(requisition.stage)
        requisition.stage = next_stage
        
        if next_stage == "approved":
            # Notify creator
            notification = Notification(
                user_id=requisition.created_by_id,
                message=f"Your requisition {requisition.req_id} has been fully approved",
                requisition_id=requisition.id
            )
            db.add(notification)
        else:
            # Notify all users with the next stage's required role
            next_role = STAGE_ROLE_MAP.get(next_stage)
            next_users = db.query(User).filter(
                User.role == next_role,
                User.is_active == True
            ).all()
            
            for user in next_users:
                notification = Notification(
                    user_id=user.id,
                    message=f"Requisition {requisition.req_id} requires your approval",
                    requisition_id=requisition.id
                )
                db.add(notification)
    
    elif approval_data.action == "rejected":
        requisition.stage = "rejected"
        # Notify creator
        notification = Notification(
            user_id=requisition.created_by_id,
            message=f"Your requisition {requisition.req_id} has been rejected at {requisition.stage} stage. Reason: {approval_data.comment}",
            requisition_id=requisition.id
        )
        db.add(notification)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid approval action"
        )
    
    db.commit()
    db.refresh(approval)
    return approval

@router.get("/{requisition_id}", response_model=List[ApprovalOut])
def get_approvals(
    requisition_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Check if requisition exists
    requisition = db.query(Requisition).filter(Requisition.id == requisition_id).first()
    if not requisition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requisition not found"
        )
    
    approvals = db.query(Approval).filter(
        Approval.requisition_id == requisition_id
    ).order_by(Approval.acted_at.asc()).all()
    
    return approvals
