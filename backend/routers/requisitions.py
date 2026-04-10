from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from database import get_db
from models import User, Requisition, Notification
from schemas import RequisitionCreate, RequisitionOut, RequisitionUpdate, RequisitionDetail
from auth import get_current_active_user

router = APIRouter(prefix="/requisitions", tags=["Requisitions"])

def generate_req_id(db):
    count = db.query(Requisition).count()
    return f"REQ-{str(count + 1).zfill(4)}"

def check_duplicate(db, title, category, department):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    existing = db.query(Requisition).filter(
        and_(
            Requisition.category == category,
            Requisition.department == department,
            Requisition.created_at >= thirty_days_ago,
            Requisition.stage != "rejected"
        )
    ).first()
    return existing is not None

@router.post("/", response_model=RequisitionOut)
def create_requisition(
    requisition: RequisitionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Generate req_id
    req_id = generate_req_id(db)
    
    # Check duplicate
    is_duplicate = check_duplicate(db, requisition.title, requisition.category, requisition.department)
    
    # Create requisition in the submitted state immediately
    new_requisition = Requisition(
        req_id=req_id,
        title=requisition.title,
        description=requisition.description,
        category=requisition.category,
        vendor_suggestion=requisition.vendor_suggestion,
        amount=requisition.amount,
        department=requisition.department,
        stage="submitted",
        is_duplicate_flag=is_duplicate,
        created_by_id=current_user.id
    )
    
    db.add(new_requisition)
    db.commit()
    db.refresh(new_requisition)
    
    # Create notification for dept_head users in same department
    dept_head_users = db.query(User).filter(
        and_(
            User.role == "dept_head",
            User.department == requisition.department,
            User.is_active == True
        )
    ).all()
    
    for dept_head in dept_head_users:
        notification = Notification(
            user_id=dept_head.id,
            message=f"New requisition {req_id} submitted by {current_user.full_name} in {requisition.department} — awaiting your review",
            requisition_id=new_requisition.id
        )
        db.add(notification)
    
    db.commit()
    return new_requisition

@router.get("/", response_model=List[RequisitionOut])
def get_requisitions(
    stage: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Requisition)
    
    # Role-based filtering
    if current_user.role == "employee":
        query = query.filter(Requisition.created_by_id == current_user.id)
    elif current_user.role == "dept_head":
        query = query.filter(Requisition.department == current_user.department)
    elif current_user.role == "finance":
        query = query.filter(
            Requisition.stage.in_(["finance_review", "procurement", "approved", "rejected"])
        )
    # admin sees all
    
    # Apply filters
    if stage:
        query = query.filter(Requisition.stage == stage)
    if department:
        query = query.filter(Requisition.department == department)
    if search:
        query = query.filter(
            or_(
                Requisition.title.contains(search),
                Requisition.req_id.contains(search)
            )
        )
    
    requisitions = query.order_by(Requisition.created_at.desc()).all()
    return requisitions

@router.get("/{req_id}", response_model=RequisitionDetail)
def get_requisition(
    req_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Try to find by req_id or id
    requisition = db.query(Requisition).filter(
        or_(
            Requisition.req_id == req_id,
            Requisition.id == req_id
        )
    ).first()
    
    if not requisition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requisition not found"
        )
    
    return requisition

@router.put("/{req_id}", response_model=RequisitionOut)
def update_requisition(
    req_id: str,
    requisition_update: RequisitionUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    requisition = db.query(Requisition).filter(
        or_(
            Requisition.req_id == req_id,
            Requisition.id == req_id
        )
    ).first()
    
    if not requisition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requisition not found"
        )
    
    # Only creator can edit
    if requisition.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only creator can edit requisition"
        )
    
    # Only allowed if stage is submitted
    if requisition.stage != "submitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only edit requisitions that are still submitted"
        )
    
    # Update fields
    update_data = requisition_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(requisition, field, value)
    
    db.commit()
    db.refresh(requisition)
    return requisition

@router.delete("/{req_id}")
def delete_requisition(
    req_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    requisition = db.query(Requisition).filter(
        or_(
            Requisition.req_id == req_id,
            Requisition.id == req_id
        )
    ).first()
    
    if not requisition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requisition not found"
        )
    
    # Only creator can delete
    if requisition.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only creator can delete requisition"
        )
    
    # Only allowed if stage is draft
    if requisition.stage != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete requisitions in draft stage"
        )
    
    db.delete(requisition)
    db.commit()
    
    return {"message": "Requisition deleted successfully"}

@router.post("/{req_id}/submit", response_model=RequisitionOut)
def submit_requisition(
    req_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    requisition = db.query(Requisition).filter(
        or_(
            Requisition.req_id == req_id,
            Requisition.id == req_id
        )
    ).first()
    
    if not requisition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requisition not found"
        )
    
    # Only creator can submit
    if requisition.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only creator can submit requisition"
        )
    
    # Only allowed if stage is draft
    if requisition.stage != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only submit requisitions in draft stage"
        )
    
    # Update stage and SLA deadline
    requisition.stage = "submitted"
    requisition.sla_deadline = datetime.utcnow() + timedelta(hours=48)
    
    # Notify dept_head users in same department
    dept_head_users = db.query(User).filter(
        and_(
            User.role == "dept_head",
            User.department == requisition.department,
            User.is_active == True
        )
    ).all()
    
    for dept_head in dept_head_users:
        notification = Notification(
            user_id=dept_head.id,
            message=f"Requisition {requisition.req_id} submitted by {current_user.full_name} requires your review",
            requisition_id=requisition.id
        )
        db.add(notification)
    
    db.commit()
    db.refresh(requisition)
    return requisition
