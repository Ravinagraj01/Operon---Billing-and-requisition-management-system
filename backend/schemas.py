from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List, Dict

# User Schemas
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str
    department: Optional[str] = None

class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    department: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

# Requisition Schemas
class RequisitionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    vendor_suggestion: Optional[str] = None
    amount: float
    department: str

class RequisitionOut(BaseModel):
    id: int
    req_id: str
    title: str
    description: Optional[str]
    category: str
    vendor_suggestion: Optional[str]
    amount: float
    department: str
    priority_score: int
    stage: str
    is_duplicate_flag: bool
    created_by_id: int
    created_at: datetime
    updated_at: datetime
    sla_deadline: Optional[datetime]
    creator: UserOut

    class Config:
        from_attributes = True

class RequisitionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    vendor_suggestion: Optional[str] = None
    amount: Optional[float] = None

class RequisitionDetail(RequisitionOut):
    comments: List['CommentOut'] = []
    approvals: List['ApprovalOut'] = []

# Approval Schemas
class ApprovalCreate(BaseModel):
    action: str  # "approved", "rejected", "returned"
    comment: Optional[str] = None

class ApprovalOut(BaseModel):
    id: int
    requisition_id: int
    stage: str
    action: str
    comment: Optional[str]
    acted_at: datetime
    approver: UserOut

    class Config:
        from_attributes = True

# Comment Schemas
class CommentCreate(BaseModel):
    message: str

class CommentOut(BaseModel):
    id: int
    requisition_id: int
    message: str
    created_at: datetime
    user: UserOut

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationOut(BaseModel):
    id: int
    message: str
    is_read: bool
    created_at: datetime
    requisition_id: Optional[int]

    class Config:
        from_attributes = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Dashboard Schemas
class DashboardStats(BaseModel):
    total_requisitions: int
    pipeline_value: float
    pending_approvals: int
    approved_value: float
    avg_approval_time_hours: float
    spend_by_department: Dict[str, float]
    stage_counts: Dict[str, int]
    sla_breached: int
