import requests
import json

def test_login():
    # Test login with admin credentials
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
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✓ Login successful!")
            token_data = response.json()
            print(f"Token: {token_data.get('access_token', 'No token')[:50]}...")
        else:
            print("✗ Login failed")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
