"""
Test script to manually add a call history record
"""
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.call_history import CallHistory

def add_test_call():
    db = SessionLocal()
    try:
        # Create a test call between user 4 (sai) and user 2 (raya)
        test_call = CallHistory(
            id=f"test_call_{int(datetime.now().timestamp())}",
            caller_id=4,  # sai
            callee_id=2,  # raya
            started_at=datetime.now() - timedelta(minutes=5),
            ended_at=datetime.now(),
            duration_seconds=300,  # 5 minutes
            status="completed",
            risk_level=None,
            risk_score=None
        )
        
        db.add(test_call)
        db.commit()
        db.refresh(test_call)
        
        print(f"? Test call added successfully!")
        print(f"   ID: {test_call.id}")
        print(f"   Caller: {test_call.caller_id}")
        print(f"   Callee: {test_call.callee_id}")
        print(f"   Duration: {test_call.duration_seconds}s")
        
    except Exception as e:
        print(f"? Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_test_call()
