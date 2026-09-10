"""
CallHistoryService Usage Example

This example demonstrates how to use the CallHistoryService to:
1. Create call history records when calls end
2. Retrieve call history for users

This service is designed to be used in the WebSocket signaling handler
when calls end, and in API endpoints for retrieving call history.
"""

import asyncio
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.call_history import CallHistoryService
from app.models.call_session import CallSession, CallState


async def example_create_completed_call():
    """Example: Create a call history record for a completed call"""
    db: Session = SessionLocal()
    call_history_service = CallHistoryService(db)
    
    # Simulate a completed call session
    call_session = CallSession(
        call_id="550e8400-e29b-41d4-a716-446655440000",
        caller_id=1,
        callee_id=2,
        caller_name="Alice Smith",
        callee_name="Bob Johnson"
    )
    
    # Simulate call progression
    call_session.set_state(CallState.CONNECTED)
    call_session.connected_at = datetime.utcnow() - timedelta(seconds=120)
    call_session.set_state(CallState.ENDED)
    
    # Add risk analysis update
    call_session.add_risk_update({
        "risk_level": "MEDIUM",
        "risk_score": 45,
        "synthetic_confidence": 50,
        "model_confidence": 90,
        "recommendation": "Moderate synthetic indicators detected. Stay alert."
    })
    
    # Create call history record
    result = await call_history_service.create_call_record(call_session)
    
    if result:
        print(f"✅ Created call history record:")
        print(f"   Call ID: {result.id}")
        print(f"   Duration: {result.duration_seconds}s")
        print(f"   Status: {result.status}")
        print(f"   Risk Level: {result.risk_level}")
        print(f"   Risk Score: {result.risk_score}")
    else:
        print("❌ Failed to create call history record")
    
    db.close()


async def example_create_rejected_call():
    """Example: Create a call history record for a rejected call"""
    db: Session = SessionLocal()
    call_history_service = CallHistoryService(db)
    
    # Simulate a rejected call session
    call_session = CallSession(
        call_id="660e8400-e29b-41d4-a716-446655440001",
        caller_id=1,
        callee_id=3,
        caller_name="Alice Smith",
        callee_name="Charlie Davis"
    )
    
    # User rejected the call
    call_session.set_state(CallState.REJECTED)
    
    # Create call history record (no risk data for rejected calls)
    result = await call_history_service.create_call_record(call_session)
    
    if result:
        print(f"✅ Created call history record for rejected call:")
        print(f"   Call ID: {result.id}")
        print(f"   Status: {result.status}")
        print(f"   Duration: {result.duration_seconds}s")
    
    db.close()


async def example_retrieve_call_history():
    """Example: Retrieve call history for a user"""
    db: Session = SessionLocal()
    call_history_service = CallHistoryService(db)
    
    # Retrieve call history for user ID 1 (limit to 10 most recent)
    user_id = 1
    call_history = await call_history_service.get_user_call_history(
        user_id=user_id,
        limit=10
    )
    
    print(f"\n📞 Call History for User {user_id}:")
    print(f"   Total calls: {len(call_history)}")
    
    for call in call_history:
        print(f"\n   Call ID: {call.id}")
        print(f"   Caller ID: {call.caller_id}")
        print(f"   Callee ID: {call.callee_id}")
        print(f"   Started: {call.started_at}")
        print(f"   Duration: {call.duration_seconds}s")
        print(f"   Status: {call.status}")
        if call.risk_level:
            print(f"   Risk: {call.risk_level} (Score: {call.risk_score})")
    
    db.close()


async def example_websocket_integration():
    """
    Example: How CallHistoryService would be used in WebSocket signaling handler
    
    This demonstrates the integration pattern for the signaling WebSocket endpoint
    when a call ends (hangup message received).
    """
    # Simulated database session (in real code, this comes from FastAPI dependency)
    db: Session = SessionLocal()
    call_history_service = CallHistoryService(db)
    
    # Simulated active call session (in real code, this comes from CallSessionManager)
    call_session = CallSession(
        call_id="770e8400-e29b-41d4-a716-446655440002",
        caller_id=2,
        callee_id=1,
        caller_name="Bob Johnson",
        callee_name="Alice Smith"
    )
    
    # Simulate call connected and then ended
    call_session.set_state(CallState.CONNECTED)
    call_session.connected_at = datetime.utcnow() - timedelta(seconds=300)
    call_session.set_state(CallState.ENDED)
    
    # Simulate multiple risk updates during the call
    call_session.add_risk_update({
        "risk_level": "LOW",
        "risk_score": 12,
        "recommendation": "Voice appears natural"
    })
    call_session.add_risk_update({
        "risk_level": "LOW",
        "risk_score": 18,
        "recommendation": "Voice appears natural"
    })
    call_session.add_risk_update({
        "risk_level": "MEDIUM",
        "risk_score": 55,
        "recommendation": "Some synthetic indicators detected"
    })
    
    # When hangup message is received:
    print("\n🔌 Hangup message received, cleaning up call...")
    
    # 1. Create call history record
    call_history = await call_history_service.create_call_record(call_session)
    
    if call_history:
        print(f"✅ Call history saved:")
        print(f"   Duration: {call_history.duration_seconds}s")
        print(f"   Final Risk: {call_history.risk_level} ({call_history.risk_score})")
    
    # 2. In real code, also:
    #    - Remove session from CallSessionManager
    #    - Clear audio buffer for this call
    #    - Forward hangup message to other participant
    
    db.close()


async def main():
    """Run all examples"""
    print("=" * 60)
    print("CallHistoryService Usage Examples")
    print("=" * 60)
    
    print("\n1️⃣  Example: Create completed call record")
    await example_create_completed_call()
    
    print("\n2️⃣  Example: Create rejected call record")
    await example_create_rejected_call()
    
    print("\n3️⃣  Example: Retrieve call history")
    await example_retrieve_call_history()
    
    print("\n4️⃣  Example: WebSocket integration pattern")
    await example_websocket_integration()
    
    print("\n" + "=" * 60)
    print("Examples completed!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
