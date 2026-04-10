from sqlalchemy.orm import Session
from models import User, Requisition, Approval, Comment, Notification
from database import SessionLocal
from auth import hash_password
from datetime import datetime, timedelta

def seed_data():
    db = SessionLocal()
    try:
        # Clear existing data to ensure fresh seed
        db.query(Comment).delete()
        db.query(Approval).delete()
        db.query(Notification).delete()
        db.query(Requisition).delete()
        db.query(User).delete()
        db.commit()
        
        print("Cleared existing data, seeding fresh data...")

        # Create users
        users = [
            User(
                full_name="Super Admin",
                email="admin@procura.com",
                hashed_password=hash_password("admin"),
                role="admin",
                department="Management"
            ),
            User(
                full_name="Finance Manager",
                email="finance@procura.com",
                hashed_password=hash_password("fin"),
                role="finance",
                department="Finance"
            ),
            User(
                full_name="Dept Head",
                email="depthead@procura.com",
                hashed_password=hash_password("dept"),
                role="dept_head",
                department="Engineering"
            ),
            User(
                full_name="John Employee",
                email="employee@procura.com",
                hashed_password=hash_password("emp"),
                role="employee",
                department="Engineering"
            )
        ]

        for user in users:
            db.add(user)
        db.commit()

        # Refresh to get IDs
        for user in users:
            db.refresh(user)

        # Create sample requisitions
        requisitions = [
            Requisition(
                req_id="REQ-0001",
                title="Laptop for New Developer",
                description="High-performance laptop for new senior developer joining next month",
                category="IT",
                vendor_suggestion="Dell Technologies",
                amount=75000.0,
                department="Engineering",
                priority_score=7,
                stage="approved",
                created_by_id=users[3].id,  # John Employee
                sla_deadline=datetime.utcnow() + timedelta(hours=48)
            ),
            Requisition(
                req_id="REQ-0002",
                title="Office Furniture Upgrade",
                description="Ergonomic chairs and standing desks for the engineering team",
                category="Operations",
                vendor_suggestion="IKEA Business",
                amount=150000.0,
                department="Engineering",
                priority_score=6,
                stage="finance_review",
                created_by_id=users[2].id,  # Dept Head
                sla_deadline=datetime.utcnow() + timedelta(hours=48)
            ),
            Requisition(
                req_id="REQ-0003",
                title="Software Licenses - Visual Studio",
                description="Annual subscription for Visual Studio Enterprise licenses",
                category="IT",
                vendor_suggestion="Microsoft",
                amount=45000.0,
                department="Engineering",
                priority_score=5,
                stage="dept_review",
                created_by_id=users[3].id,  # John Employee
                sla_deadline=datetime.utcnow() + timedelta(hours=48)
            ),
            Requisition(
                req_id="REQ-0004",
                title="Marketing Campaign Budget",
                description="Q3 digital marketing campaign including social media ads",
                category="Marketing",
                vendor_suggestion="Multiple vendors",
                amount=200000.0,
                department="Marketing",
                priority_score=8,
                stage="dept_review",
                created_by_id=users[3].id,  # John Employee
                sla_deadline=datetime.utcnow() + timedelta(hours=48)
            ),
            Requisition(
                req_id="REQ-0005",
                title="Legal Consultation Services",
                description="External legal counsel for contract review and compliance",
                category="Legal",
                vendor_suggestion="Law Associates Inc",
                amount=85000.0,
                department="Management",
                priority_score=6,
                stage="procurement",
                created_by_id=users[0].id,  # Admin
                sla_deadline=datetime.utcnow() + timedelta(hours=48)
            ),
            Requisition(
                req_id="REQ-0006",
                title="Security Audit Services",
                description="Annual security audit and penetration testing",
                category="Security",
                vendor_suggestion="SecureNet Solutions",
                amount=120000.0,
                department="Engineering",
                priority_score=9,
                stage="draft",
                created_by_id=users[2].id,  # Dept Head
                sla_deadline=datetime.utcnow() + timedelta(hours=48)
            )
        ]

        for req in requisitions:
            db.add(req)
        
        db.commit()
        print("Seed data created successfully")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()
