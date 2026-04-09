import requests

def test_all_endpoints():
    print("🧪 Testing all backend endpoints...")
    
    base_url = "http://localhost:8000"
    
    # Test endpoints that should exist
    endpoints = [
        ("/", "Root"),
        ("/auth/me", "Auth Me"),
        ("/dashboard/stats", "Dashboard Stats"),
        ("/requisitions", "Requisitions"),
        ("/notifications", "Notifications"),
        ("/users", "Users"),
        ("/approvals", "Approvals")
    ]
    
    # First login to get token
    login_data = {
        "username": "admin@procura.com",
        "password": "admin"
    }
    
    try:
        login_response = requests.post(
            f"{base_url}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if login_response.status_code == 200:
            token = login_response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("✅ Login successful, testing endpoints...")
        else:
            print("❌ Login failed, testing without auth...")
            headers = {}
    except Exception as e:
        print(f"❌ Login error: {e}")
        headers = {}
    
    print("\n📋 Testing endpoints:")
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", headers=headers)
            status = "✅" if response.status_code == 200 else "❌"
            print(f"{status} {name} ({endpoint}): {response.status_code}")
            if response.status_code != 200:
                print(f"   Error: {response.text[:100]}...")
        except Exception as e:
            print(f"❌ {name} ({endpoint}): Error - {e}")

if __name__ == "__main__":
    test_all_endpoints()
