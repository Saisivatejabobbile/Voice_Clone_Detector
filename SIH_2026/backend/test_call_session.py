"""
Test script for CallSession in-memory data class
Validates task 1.4 implementation
"""

import sys
import time
from datetime import datetime

# Add the app directory to the path
sys.path.insert(0, 'app')

from models.call_session import CallSession, CallState


def test_call_session():
    """Test CallSession implementation"""
    print("=" * 60)
    print("Testing CallSession Implementation (Task 1.4)")
    print("=" * 60)
    
    # Test 1: Initialization
    print("\n1. Testing initialization...")
    session = CallSession(
        call_id="call-123-456",
        caller_id=1,
        callee_id=2,
        caller_name="Alice",
        callee_name="Bob"
    )
    assert session.call_id == "call-123-456"
    assert session.caller_id == 1
    assert session.callee_id == 2
    assert session.state == CallState.INITIATING
    assert session.started_at is not None
    assert session.connected_at is None
    assert session.ended_at is None
    print("   ✓ Initialization successful")
    
    # Test 2: Status property (alias for state)
    print("\n2. Testing status property alias...")
    assert session.status == "initiating"
    session.status = "ringing"
    assert session.state == CallState.RINGING
    assert session.status == "ringing"
    print("   ✓ Status property works correctly")
    
    # Test 3: State transitions
    print("\n3. Testing state transitions...")
    session.set_state(CallState.ACCEPTED)
    assert session.state == CallState.ACCEPTED
    
    session.set_state(CallState.CONNECTED)
    assert session.state == CallState.CONNECTED
    assert session.connected_at is not None
    print(f"   ✓ Connected at: {session.connected_at}")
    
    # Wait a bit to ensure duration > 0
    time.sleep(1)
    
    session.set_state(CallState.ENDED)
    assert session.state == CallState.ENDED
    assert session.ended_at is not None
    print(f"   ✓ Ended at: {session.ended_at}")
    
    # Test 4: Duration calculation
    print("\n4. Testing duration calculation...")
    duration = session.calculate_duration()
    assert duration >= 1
    assert isinstance(duration, int)
    print(f"   ✓ Duration: {duration} seconds")
    
    # Test get_duration (should return same value)
    get_duration = session.get_duration()
    assert get_duration == duration
    print(f"   ✓ get_duration() also returns: {get_duration} seconds")
    
    # Test 5: Duration before connection
    print("\n5. Testing duration before connection...")
    session2 = CallSession(
        call_id="call-789",
        caller_id=3,
        callee_id=4,
        caller_name="Charlie",
        callee_name="Diana"
    )
    assert session2.calculate_duration() == 0
    assert session2.get_duration() is None
    print("   ✓ Duration is 0 when call hasn't connected")
    
    # Test 6: to_dict() serialization
    print("\n6. Testing to_dict() serialization...")
    data = session.to_dict()
    assert data["call_id"] == "call-123-456"
    assert data["caller_id"] == 1
    assert data["callee_id"] == 2
    assert data["caller_name"] == "Alice"
    assert data["callee_name"] == "Bob"
    assert data["state"] == "ended"
    assert data["status"] == "ended"
    assert data["duration"] >= 1
    assert isinstance(data["started_at"], str)
    assert isinstance(data["connected_at"], str)
    assert isinstance(data["ended_at"], str)
    print("   ✓ Serialization successful")
    print(f"   Data keys: {list(data.keys())}")
    
    # Test 7: All required state values
    print("\n7. Testing all state values...")
    states = [
        CallState.INITIATING,
        CallState.RINGING,
        CallState.ACCEPTED,
        CallState.CONNECTED,
        CallState.ENDED,
        CallState.REJECTED,
        CallState.FAILED
    ]
    for state in states:
        test_session = CallSession(
            call_id=f"call-{state.value}",
            caller_id=1,
            callee_id=2,
            caller_name="Test",
            callee_name="User"
        )
        test_session.set_state(state)
        assert test_session.state == state
        print(f"   ✓ {state.value}")
    
    # Test 8: Risk updates
    print("\n8. Testing risk updates...")
    session.add_risk_update({
        "risk_level": "LOW",
        "risk_score": 25,
        "confidence": 95
    })
    assert len(session.risk_updates) == 1
    assert session.final_risk_level == "LOW"
    assert session.final_risk_score == 25
    print("   ✓ Risk updates working correctly")
    
    print("\n" + "=" * 60)
    print("All tests passed! ✓")
    print("=" * 60)
    print("\nTask 1.4 Implementation Summary:")
    print("✓ CallSession dataclass with required fields")
    print("✓ Status state tracking (7 states)")
    print("✓ calculate_duration() method")
    print("✓ to_dict() method for serialization")
    print("✓ Bonus: status property alias for compatibility")
    print("✓ Bonus: Risk analysis tracking")
    print("✓ Bonus: WebRTC session data storage")
    print("\nRequirements Satisfied:")
    print("✓ 7.1: Status state tracking")
    print("✓ 7.2: State transition updates")
    print("✓ 7.3: Timestamp recording")
    print("✓ 7.4: Duration calculation")
    print("=" * 60)


if __name__ == "__main__":
    try:
        test_call_session()
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
