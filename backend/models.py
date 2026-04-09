from sqlalchemy import Boolean, Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "employee", "dept_head", "finance", "admin"
    department = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    requisitions = relationship("Requisition", back_populates="creator")
    comments = relationship("Comment", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    approvals_given = relationship("Approval", back_populates="approver")

class Requisition(Base):
    __tablename__ = "requisitions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    req_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False)
    vendor_suggestion = Column(String, nullable=True)
    amount = Column(Float, nullable=False)
    department = Column(String, nullable=False)
    priority_score = Column(Integer, default=5)
    stage = Column(String, default="draft")  # draft, submitted, dept_review, finance_review, procurement, approved, rejected
    is_duplicate_flag = Column(Boolean, default=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    sla_deadline = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    creator = relationship("User", back_populates="requisitions")
    comments = relationship("Comment", back_populates="requisition")
    approvals = relationship("Approval", back_populates="requisition")

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    requisition_id = Column(Integer, ForeignKey("requisitions.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stage = Column(String, nullable=False)  # which stage this approval belongs to
    action = Column(String, nullable=False)  # "approved", "rejected", "returned"
    comment = Column(Text, nullable=True)
    acted_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    requisition = relationship("Requisition", back_populates="approvals")
    approver = relationship("User", back_populates="approvals_given")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    requisition_id = Column(Integer, ForeignKey("requisitions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    requisition = relationship("Requisition", back_populates="comments")
    user = relationship("User", back_populates="comments")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    requisition_id = Column(Integer, ForeignKey("requisitions.id"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="notifications")
    requisition = relationship("Requisition")
