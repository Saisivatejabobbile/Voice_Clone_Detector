"""
Test WebSocket Signaling
Simple script to test WebRTC signaling WebSocket
"""

import asyncio
import websockets
import json
import requests


async def test_signaling():
    """Test the signaling WebSocket"""
    
    print("=" * 60)
    print("VoiceShield - WebSocket Signaling Test")
    print("=" * 60)
    print()
    
    # Step 1: Login to get token
    print("Step 1: Logging in...")
    response = requests.post(
        "http://localhost:8000/api/auth/login",
        json={
            "email": "demo@voiceshield.com",
            "password": "Demo123!"
        }
    )
    
    if response.status_code != 200:
        print("❌ Login failed!")
        print(response.json())
        return
    
    token = response.json()["access_token"]
    print(f"✓ Logged in successfully")
    print(f"  Token: {token[:50]}...")
    print()
    
    # Step 2: Connect to WebSocket
    print("Step 2: Connecting to WebSocket...")
    ws_url = f"ws://localhost:8000/ws/signaling?token={token}"
    
    try:
        async with websockets.connect(ws_url) as websocket:
            print("✓ Connected to signaling WebSocket!")
            print()
            
            # Step 3: Send a test message
            print("Step 3: Testing message sending...")
            
            test_message = {
                "type": "call_initiate",
                "call_id": "test-call-123",
                "callee_id": 2  # John Doe
            }
            
            await websocket.send(json.dumps(test_message))
            print(f"✓ Sent message: {test_message['type']}")
            print()
            
            # Step 4: Wait for response
            print("Step 4: Waiting for response...")
            print("  (Waiting up to 5 seconds...)")
            
            try:
                response = await asyncio.wait_for(
                    websocket.recv(),
                    timeout=5.0
                )
                message = json.loads(response)
                print(f"✓ Received response!")
                print(f"  Type: {message.get('type')}")
                print(f"  Data: {json.dumps(message, indent=2)}")
            except asyncio.TimeoutError:
                print("⚠️  No response received (timeout)")
                print("  This is normal if callee is offline")
            
            print()
            print("=" * 60)
            print("✓ WebSocket Test Complete!")
            print("=" * 60)
            print()
            print("Connection working! You can now:")
            print("  1. Connect frontend with backend")
            print("  2. Make real calls between users")
            print("  3. Test WebRTC signaling flow")
            
    except websockets.exceptions.WebSocketException as e:
        print(f"❌ WebSocket error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    print()
    print("Make sure the backend server is running!")
    print("  → python run.py")
    print()
    
    asyncio.run(test_signaling())
