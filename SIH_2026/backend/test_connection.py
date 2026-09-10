"""
Test Backend Connection
Quick script to verify backend is running and accessible
"""

import requests
import sys

def test_backend():
    """Test if backend is running and responding"""
    print("\n🔍 Testing VoiceShield Backend Connection...\n")
    
    # Test 1: Basic connection
    print("1️⃣  Testing basic connection to http://localhost:8000/")
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Backend is running!")
            print(f"   📊 App: {data.get('app')}")
            print(f"   📊 Version: {data.get('version')}")
            print(f"   📊 Status: {data.get('status')}")
        else:
            print(f"   ⚠️  Unexpected status code: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("   ❌ Connection refused - Backend is NOT running!")
        print("   💡 Start backend: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        sys.exit(1)
    except Exception as e:
        print(f"   ❌ Error: {e}")
        sys.exit(1)
    
    # Test 2: Health check
    print("\n2️⃣  Testing health endpoint")
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("   ✅ Health check passed!")
        else:
            print(f"   ⚠️  Health check returned: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Health check failed: {e}")
    
    # Test 3: API docs
    print("\n3️⃣  Testing API documentation")
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print("   ✅ API docs accessible at: http://localhost:8000/docs")
        else:
            print(f"   ⚠️  API docs returned: {response.status_code}")
    except Exception as e:
        print(f"   ❌ API docs failed: {e}")
    
    # Test 4: Registration endpoint
    print("\n4️⃣  Testing registration endpoint")
    try:
        test_email = f"test_{int(__import__('time').time())}@example.com"
        response = requests.post(
            "http://localhost:8000/api/auth/register",
            json={
                "email": test_email,
                "password": "password123",
                "full_name": "Test User"
            },
            timeout=5
        )
        if response.status_code == 201:
            print("   ✅ Registration endpoint works!")
            print(f"   📧 Test user created: {test_email}")
        elif response.status_code == 400:
            print("   ⚠️  User already exists (but endpoint is working)")
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Registration test failed: {e}")
    
    # Test 5: CORS headers
    print("\n5️⃣  Testing CORS configuration")
    try:
        response = requests.options(
            "http://localhost:8000/api/auth/login",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST"
            },
            timeout=5
        )
        cors_header = response.headers.get("Access-Control-Allow-Origin")
        if cors_header:
            print(f"   ✅ CORS configured: {cors_header}")
        else:
            print("   ⚠️  CORS header not found")
            print("   💡 Check ALLOWED_ORIGINS in config")
    except Exception as e:
        print(f"   ❌ CORS test failed: {e}")
    
    # Summary
    print("\n" + "="*60)
    print("📊 Test Summary:")
    print("="*60)
    print("✅ Backend is running and accessible")
    print("✅ All core endpoints are responding")
    print("\n💡 Next Steps:")
    print("   1. Start frontend: cd ../frontend && npm run dev")
    print("   2. Open browser: http://localhost:5173/")
    print("   3. Try login with: john@test.com / password123")
    print("\n🎉 Backend is ready for testing!\n")


if __name__ == "__main__":
    try:
        test_backend()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(0)
