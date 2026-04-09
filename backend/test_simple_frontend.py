import requests

def test_simple_frontend():
    print("🧪 Testing simple frontend-style requests...")
    
    # Test 1: Form data like frontend
    print("\n1. Testing form data request...")
    try:
        login_data = {
            'username': 'admin@procura.com',
            'password': 'admin'
        }
        
        response = requests.post(
            "http://localhost:8000/auth/login",
            data=login_data,
            headers={
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        )
        
        print(f"Direct Status: {response.status_code}")
        print(f"Direct Response: {response.text[:100]}...")
        
    except Exception as e:
        print(f"Direct Error: {e}")
    
    # Test 2: Through frontend proxy
    print("\n2. Testing through frontend proxy...")
    try:
        response = requests.post(
            "http://localhost:5173/api/auth/login",
            data=login_data,
            headers={
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        )
        
        print(f"Proxy Status: {response.status_code}")
        print(f"Proxy Response: {response.text[:100]}...")
        
        if response.status_code == 200:
            print("✅ Frontend proxy works!")
        else:
            print("❌ Frontend proxy issue!")
            
    except Exception as e:
        print(f"Proxy Error: {e}")
    
    # Test 3: Check if frontend is running
    print("\n3. Testing frontend availability...")
    try:
        response = requests.get("http://localhost:5173/")
        print(f"Frontend Status: {response.status_code}")
    except Exception as e:
        print(f"Frontend not accessible: {e}")

if __name__ == "__main__":
    test_simple_frontend()
