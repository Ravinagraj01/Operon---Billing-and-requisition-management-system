import requests
from urllib.parse import urlencode

def test_different_formats():
    print("🧪 Testing different login request formats...")
    
    base_url = "http://localhost:8000"
    
    # Test 1: URLSearchParams format (what I just fixed)
    print("\n1. Testing URLSearchParams format...")
    try:
        data = urlencode({
            'username': 'admin@procura.com',
            'password': 'admin'
        })
        
        response = requests.post(
            f"{base_url}/auth/login",
            data=data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:100]}...")
        
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Direct dict (what requests does by default)
    print("\n2. Testing direct dict format...")
    try:
        response = requests.post(
            f"{base_url}/auth/login",
            data={
                'username': 'admin@procura.com',
                'password': 'admin'
            }
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:100]}...")
        
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 3: FormData format (what was causing the issue)
    print("\n3. Testing FormData format...")
    try:
        from requests_toolbelt.multipart.encoder import MultipartEncoder
        data = MultipartEncoder(
            fields={
                'username': 'admin@procura.com',
                'password': 'admin'
            }
        )
        
        response = requests.post(
            f"{base_url}/auth/login",
            data=data,
            headers={'Content-Type': data.content_type}
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:100]}...")
        
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 4: JSON format (for comparison)
    print("\n4. Testing JSON format...")
    try:
        response = requests.post(
            f"{base_url}/auth/login",
            json={
                'username': 'admin@procura.com',
                'password': 'admin'
            }
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:100]}...")
        
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_login_formats()
