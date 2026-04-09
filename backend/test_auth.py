from database import SessionLocal
from models import User
from simple_auth import simple_hash, simple_verify

def test_auth():
    db = SessionLocal()
    try:
        # Check if users exist
        users = db.query(User).all()
        print(f"Found {len(users)} users in database:")
        
        for user in users:
            print(f"- {user.email} (role: {user.role})")
            print(f"  Hash: {user.hashed_password}")
            
            # Test password verification
            test_passwords = ["admin", "fin", "dept", "emp"]
            for pwd in test_passwords:
                if simple_verify(pwd, user.hashed_password):
                    print(f"  ✓ Password '{pwd}' works!")
                    break
            else:
                print(f"  ✗ No simple password works")
            print()
        
        # Test creating a new user hash
        test_hash = simple_hash("admin")
        print(f"New hash for 'admin': {test_hash}")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_auth()
