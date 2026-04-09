import requests

def test_root():
    try:
        response = requests.get("http://localhost:8000/")
        print(f"Root endpoint status: {response.status_code}")
        print(f"Root response: {response.json()}")
    except Exception as e:
        print(f"Error connecting to backend: {e}")

if __name__ == "__main__":
    test_root()
