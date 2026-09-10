"""
Test call_history table constraints
Verifies CHECK constraints and foreign key constraints work correctly
"""

import sys
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).parent))

from datetime import datetime, timezone
import uuid
from sqlalchemy.exc import IntegrityError
from app.database import SessionLocal
from app.models.call_history import CallHistory
from app.models.user import User


def test_constraints():
    """Test all database constraints"""
    
    print("=" * 60)
    print("Testing call_history table constraints")
    print("=" * 60)
    print()
    
    db = SessionLocal()
    
    try:
        # Create test users
        print("1️⃣  Creating test users...")
        user1 = User(
            email=f"test_caller_{uuid.uuid4().hex[:8]}@test.com",
            hashed_password="dummy_hash",
            full_name="Test Caller",
            is_active=True
        )
        user2 = User(
            email=f"test_callee_{uuid.uuid4().hex[:8]}@test.com",
            hashed_password="dummy_hash",
            full_name="Test Callee",
            is_active=True
        )
        db.add(user1)
        db.add(user2)
        db.commit()
        db.refresh(user1)
        db.refresh(user2)
        print(f"   ✅ Created users: {user1.id}, {user2.id}")
        print()
        
        # Test 1: Valid call history record
        print("2️⃣  Testing valid call history record...")
        call_id = str(uuid.uuid4())
        call = CallHistory(
            id=call_id,
            caller_id=user1.id,
            callee_id=user2.id,
            started_at=datetime.now(timezone.utc),
            ended_at=datetime.now(timezone.utc),
            duration_seconds=120,
            status="completed",
            risk_level="LOW",
            risk_score=15
        )
        db.add(call)
        db.commit()
        print(f"   ✅ Successfully created call history: {call_id}")
        print()
        
        # Test 2: Invalid duration (negative)
        print("3️⃣  Testing CHECK constraint: duration_seconds >= 0")
        try:
            invalid_call = CallHistory(
                id=str(uuid.uuid4()),
                caller_id=user1.id,
                callee_id=user2.id,
                started_at=datetime.now(timezone.utc),
                duration_seconds=-10,  # Invalid
                status="completed"
            )
            db.add(invalid_call)
            db.commit()
            print("   ❌ FAILED: Negative duration was accepted!")
        except IntegrityError as e:
            db.rollback()
            print("   ✅ PASSED: Negative duration rejected")
            print(f"      Error: {str(e).split('DETAIL:')[0].strip()[:100]}...")
        print()
        
        # Test 3: Invalid risk_score (> 100)
        print("4️⃣  Testing CHECK constraint: risk_score between 0-100")
        try:
            invalid_call = CallHistory(
                id=str(uuid.uuid4()),
                caller_id=user1.id,
                callee_id=user2.id,
                started_at=datetime.now(timezone.utc),
                duration_seconds=60,
                status="completed",
                risk_score=150  # Invalid
            )
            db.add(invalid_call)
            db.commit()
            print("   ❌ FAILED: Risk score > 100 was accepted!")
        except IntegrityError as e:
            db.rollback()
            print("   ✅ PASSED: Risk score > 100 rejected")
            print(f"      Error: {str(e).split('DETAIL:')[0].strip()[:100]}...")
        print()
        
        # Test 4: Invalid risk_score (< 0)
        print("5️⃣  Testing CHECK constraint: risk_score >= 0")
        try:
            invalid_call = CallHistory(
                id=str(uuid.uuid4()),
                caller_id=user1.id,
                callee_id=user2.id,
                started_at=datetime.now(timezone.utc),
                duration_seconds=60,
                status="completed",
                risk_score=-5  # Invalid
            )
            db.add(invalid_call)
            db.commit()
            print("   ❌ FAILED: Negative risk score was accepted!")
        except IntegrityError as e:
            db.rollback()
            print("   ✅ PASSED: Negative risk score rejected")
            print(f"      Error: {str(e).split('DETAIL:')[0].strip()[:100]}...")
        print()
        
        # Test 5: NULL risk_score (should be allowed)
        print("6️⃣  Testing NULL risk_score (should be allowed)...")
        try:
            valid_call = CallHistory(
                id=str(uuid.uuid4()),
                caller_id=user1.id,
                callee_id=user2.id,
                started_at=datetime.now(timezone.utc),
                duration_seconds=60,
                status="completed",
                risk_score=None  # Valid
            )
            db.add(valid_call)
            db.commit()
            print("   ✅ PASSED: NULL risk_score accepted")
        except Exception as e:
            db.rollback()
            print(f"   ❌ FAILED: {e}")
        print()
        
        # Test 6: Foreign key constraint
        print("7️⃣  Testing foreign key constraint (invalid user_id)...")
        try:
            invalid_call = CallHistory(
                id=str(uuid.uuid4()),
                caller_id=999999,  # Non-existent user
                callee_id=user2.id,
                started_at=datetime.now(timezone.utc),
                duration_seconds=60,
                status="completed"
            )
            db.add(invalid_call)
            db.commit()
            print("   ❌ FAILED: Invalid foreign key was accepted!")
        except IntegrityError as e:
            db.rollback()
            print("   ✅ PASSED: Invalid foreign key rejected")
            print(f"      Error: {str(e).split('DETAIL:')[0].strip()[:100]}...")
        print()
        
        # Test 7: Index verification
        print("8️⃣  Testing indexes exist...")
        from sqlalchemy import inspect
        inspector = inspect(db.bind)
        indexes = inspector.get_indexes("call_history")
        indexed_cols = set()
        for idx in indexes:
            indexed_cols.update(idx["column_names"])
        
        required_indexes = ["caller_id", "callee_id", "started_at", "risk_level"]
        for col in required_indexes:
            if col in indexed_cols:
                print(f"   ✅ Index on {col} exists")
            else:
                print(f"   ❌ Index on {col} missing")
        print()
        
        print("=" * 60)
        print("✅ All constraint tests completed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup
        db.query(CallHistory).filter(CallHistory.caller_id.in_([user1.id, user2.id])).delete()
        db.query(User).filter(User.id.in_([user1.id, user2.id])).delete()
        db.commit()
        db.close()


if __name__ == "__main__":
    test_constraints()
