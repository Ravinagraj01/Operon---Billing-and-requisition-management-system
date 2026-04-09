from database import SessionLocal
from models import User
from simple_auth import simple_hash, simple_verify

def check_database():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print("🔍 Checking database contents...")
        print("=" * 50)
        
        for user in users:
            print(f"\n👤 User: {user.email}")
            print(f"   Role: {user.role}")
            print(f"   Hash: {user.hashed_password}")
            print(f"   Hash Length: {len(user.hashed_password)}")
            
            # Test with simple auth
            test_passwords = ["admin", "fin", "dept", "emp"]
            for pwd in test_passwords:
                if simple_verify(pwd, user.hashed_password):
                    print(f"   ✅ Password '{pwd}' VERIFIED with simple auth")
                    break
            else:
                print(f"   ❌ No simple password works")
                
            # Test what the hash should be
            expected_hashes = {
                "admin@procura.com": simple_hash("admin"),
                "finance@procura.com": simple_hash("fin"),
                "depthead@procura.com": simple_hash("dept"),
                "employee@procura.com": simple_hash("emp")
            }
            
            if user.email in expected_hashes:
                expected = expected_hashes[user.email]
                if user.hashed_password == expected:
                    print(f"   ✅ Hash matches expected value")
                else:
                    print(f"   ❌ Hash mismatch!")
                    print(f"      Expected: {expected}")
                    print(f"      Actual:   {user.hashed_password}")
        
        print("\n" + "=" * 50)
        print("🧪 Testing login endpoint directly...")
        
        # Test login request
        import requests
        
        login_data = {
            "username": "admin@procura.com",
            "password": "admin"
        }
        
        try:
            response = requests.post(
                "http://localhost:8000/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            print(f"Login Response Status: {response.status_code}")
            print(f"Login Response: {response.text}")
        except Exception as e:
            print(f"Login Error: {e}")
        
    finally:
        db.close()

if __name__ == "__main__":
    check_database()
