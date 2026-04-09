from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Requisition, Comment, Notification
from schemas import CommentCreate, CommentOut
from auth import get_current_active_user, require_admin

router = APIRouter(prefix="/comments", tags=["Comments"])

@router.post("/{requisition_id}", response_model=CommentOut)
def create_comment(
    requisition_id: int,
    comment_data: CommentCreate,
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
    
    # Create comment
    comment = Comment(
        requisition_id=requisition_id,
        user_id=current_user.id,
        message=comment_data.message
    )
    
    db.add(comment)
    
    # Notify requisition creator if commenter is not the creator
    if current_user.id != requisition.created_by_id:
        notification = Notification(
            user_id=requisition.created_by_id,
            message=f"{current_user.full_name} commented on your requisition {requisition.req_id}",
            requisition_id=requisition_id
        )
        db.add(notification)
    
    db.commit()
    db.refresh(comment)
    return comment

@router.get("/{requisition_id}", response_model=List[CommentOut])
def get_comments(
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
    
    comments = db.query(Comment).filter(
        Comment.requisition_id == requisition_id
    ).order_by(Comment.created_at.asc()).all()
    
    return comments

@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Only comment author or admin can delete
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only comment author or admin can delete comment"
        )
    
    db.delete(comment)
    db.commit()
    
    return {"message": "Comment deleted successfully"}
