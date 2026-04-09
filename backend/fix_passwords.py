from database import SessionLocal
from models import User
from simple_auth import simple_hash

def fix_passwords():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Found {len(users)} users to update...")
        
        password_map = {
            "admin@procura.com": "admin",
            "finance@procura.com": "fin", 
            "depthead@procura.com": "dept",
            "employee@procura.com": "emp"
        }
        
        for user in users:
            if user.email in password_map:
                new_password = password_map[user.email]
                new_hash = simple_hash(new_password)
                
                print(f"Updating {user.email}: {user.hashed_password[:20]}... -> {new_hash[:20]}...")
                user.hashed_password = new_hash
        
        db.commit()
        print("✅ Passwords updated successfully!")
        
        # Test the updates
        print("\n🧪 Testing updated passwords:")
        for user in users:
            if user.email in password_map:
                test_password = password_map[user.email]
                test_hash = simple_hash(test_password)
                if user.hashed_password == test_hash:
                    print(f"✅ {user.email} - password '{test_password}' works!")
                else:
                    print(f"❌ {user.email} - password verification failed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_passwords()
