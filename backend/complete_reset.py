import os
import sys
from database import engine, Base, SessionLocal
from models import User, Requisition, Approval, Comment, Notification
from auth import hash_password
from datetime import datetime, timedelta

def complete_reset():
    print("🔄 Starting complete database reset...")
    
    # Delete the database file if it exists
    db_file = "procura.db"
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
            print(f"✓ Deleted {db_file}")
        except PermissionError:
            print(f"⚠️  Could not delete {db_file} (file in use)")
            print("   Please stop the server and run this script again")
            return False
    
    # Recreate all tables
    print("📋 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")
    
    # Seed data
    print("🌱 Seeding database...")
    db = SessionLocal()
    
    try:
        # Create users
        users = [
            User(
                full_name="Super Admin",
                email="admin@procura.com",
                hashed_password=hash_password("admin"),
                role="admin",
                department="Management",
                is_active=True,
                created_at=datetime.utcnow()
            ),
            User(
                full_name="Finance Manager",
                email="finance@procura.com",
                hashed_password=hash_password("fin"),
                role="finance",
                department="Finance",
                is_active=True,
                created_at=datetime.utcnow()
            ),
            User(
                full_name="Dept Head",
                email="depthead@procura.com",
                hashed_password=hash_password("dept"),
                role="dept_head",
                department="Engineering",
                is_active=True,
                created_at=datetime.utcnow()
            ),
            User(
                full_name="John Employee",
                email="employee@procura.com",
                hashed_password=hash_password("emp"),
                role="employee",
                department="Engineering",
                is_active=True,
                created_at=datetime.utcnow()
            )
        ]
        
        for user in users:
            db.add(user)
        db.commit()
        
        # Refresh to get IDs
        for user in users:
            db.refresh(user)
        
        print("✓ Created 4 users")
        
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
                created_by_id=users[3].id,
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
                created_by_id=users[2].id,
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
                created_by_id=users[3].id,
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
                stage="submitted",
                created_by_id=users[3].id,
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
                created_by_id=users[0].id,
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
                created_by_id=users[2].id,
                sla_deadline=datetime.utcnow() + timedelta(hours=48)
            )
        ]
        
        for req in requisitions:
            db.add(req)
        db.commit()
        db.refresh(requisitions)
        
        print("✓ Created 6 requisitions")
        
        # Create some approvals for the approved requisition
        approvals = [
            Approval(
                requisition_id=requisitions[0].id,
                approver_id=users[2].id,
                stage="submitted",
                action="approved",
                comment="Approved for engineering team",
                acted_at=datetime.utcnow()
            ),
            Approval(
                requisition_id=requisitions[0].id,
                approver_id=users[1].id,
                stage="dept_review",
                action="approved",
                comment="Budget approved",
                acted_at=datetime.utcnow()
            ),
            Approval(
                requisition_id=requisitions[0].id,
                approver_id=users[1].id,
                stage="finance_review",
                action="approved",
                comment="Finance cleared",
                acted_at=datetime.utcnow()
            ),
            Approval(
                requisition_id=requisitions[0].id,
                approver_id=users[0].id,
                stage="procurement",
                action="approved",
                comment="Final approval",
                acted_at=datetime.utcnow()
            )
        ]
        
        for approval in approvals:
            db.add(approval)
        db.commit()
        
        print("✓ Created approvals")
        
        # Create some comments
        comments = [
            Comment(
                requisition_id=requisitions[0].id,
                user_id=users[3].id,
                message="Please ensure this laptop meets our development requirements",
                created_at=datetime.utcnow()
            ),
            Comment(
                requisition_id=requisitions[0].id,
                user_id=users[2].id,
                message="I've confirmed this meets our tech specs",
                created_at=datetime.utcnow()
            ),
            Comment(
                requisition_id=requisitions[2].id,
                user_id=users[3].id,
                message="Need this for the new developer starting next month",
                created_at=datetime.utcnow()
            )
        ]
        
        for comment in comments:
            db.add(comment)
        db.commit()
        
        print("✓ Created comments")
        
        # Create some notifications
        notifications = [
            Notification(
                user_id=users[2].id,
                message=f"New requisition {requisitions[2].req_id} submitted by {users[3].full_name} in {requisitions[2].department} — awaiting your review",
                requisition_id=requisitions[2].id,
                is_read=False,
                created_at=datetime.utcnow()
            ),
            Notification(
                user_id=users[1].id,
                message=f"Requisition {requisitions[1].req_id} requires your approval",
                requisition_id=requisitions[1].id,
                is_read=False,
                created_at=datetime.utcnow()
            ),
            Notification(
                user_id=users[3].id,
                message=f"Your requisition {requisitions[0].req_id} has been fully approved",
                requisition_id=requisitions[0].id,
                is_read=False,
                created_at=datetime.utcnow()
            )
        ]
        
        for notification in notifications:
            db.add(notification)
        db.commit()
        
        print("✓ Created notifications")
        
        print("\n🎉 Database reset and seeding completed successfully!")
        print("\n📊 Summary:")
        print(f"   Users: {len(users)}")
        print(f"   Requisitions: {len(requisitions)}")
        print(f"   Approvals: {len(approvals)}")
        print(f"   Comments: {len(comments)}")
        print(f"   Notifications: {len(notifications)}")
        
        print("\n🔑 Login Credentials:")
        print("   Admin: admin@procura.com / admin")
        print("   Finance: finance@procura.com / fin")
        print("   Dept Head: depthead@procura.com / dept")
        print("   Employee: employee@procura.com / emp")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = complete_reset()
    if success:
        print("\n✅ Ready to start the server!")
        print("   Run: uvicorn main:app --reload --port 8000")
    else:
        print("\n❌ Please fix the errors and try again")
