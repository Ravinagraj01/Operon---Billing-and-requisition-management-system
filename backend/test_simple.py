import requests
from urllib.parse import urlencode

def test_login():
    print("🧪 Testing login with URLSearchParams format...")
    
    # Test the format I fixed in the frontend
    data = urlencode({
        'username': 'admin@procura.com',
        'password': 'admin'
    })
    
    try:
        response = requests.post(
            "http://localhost:8000/auth/login",
            data=data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ URLSearchParams format works!")
        else:
            print("❌ URLSearchParams format failed!")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
