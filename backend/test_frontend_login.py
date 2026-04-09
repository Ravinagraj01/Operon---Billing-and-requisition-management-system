import requests
from requests_toolbelt.multipart.encoder import MultipartEncoder

def test_frontend_login_style():
    print("🧪 Testing frontend-style login request...")
    
    # Test exactly like the frontend sends it
    login_data = MultipartEncoder(
        fields={
            'username': 'admin@procura.com',
            'password': 'admin'
        }
    )
    
    try:
        response = requests.post(
            "http://localhost:8000/auth/login",
            data=login_data,
            headers={
                'Content-Type': login_data.content_type
            }
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Frontend-style login works!")
        else:
            print("❌ Frontend-style login failed!")
            
    except Exception as e:
        print(f"Error: {e}")
    
    # Test through frontend proxy
    print("\n🌐 Testing through frontend proxy...")
    try:
        proxy_data = MultipartEncoder(
            fields={
                'username': 'admin@procura.com',
                'password': 'admin'
            }
        )
        
        response = requests.post(
            "http://localhost:5173/api/auth/login",
            data=proxy_data,
            headers={
                'Content-Type': proxy_data.content_type
            }
        )
        
        print(f"Proxy Status Code: {response.status_code}")
        print(f"Proxy Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Frontend proxy login works!")
        else:
            print("❌ Frontend proxy login failed!")
            
    except Exception as e:
        print(f"Proxy Error: {e}")

if __name__ == "__main__":
    test_frontend_login_style()
