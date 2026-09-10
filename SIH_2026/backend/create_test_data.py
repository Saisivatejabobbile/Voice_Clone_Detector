"""
Create Test Data
Populate database with sample users and call history for testing
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random

from app.database import SessionLocal, create_tables
from app.models.user import User
from app.models.call_history import CallHistory
from app.auth.security import get_password_hash


def create_test_users(db: Session):
    """Create sample users"""
    print("Creating test users...")
    
    users_data = [
        {
            "email": "demo@voiceshield.com",
            "full_name": "Demo User",
            "password": "Demo123!",
            "is_online": True
        },
        {
            "email": "john.doe@example.com",
            "full_name": "John Doe",
            "password": "Test123!",
            "is_online": True
        },
        {
            "email": "jane.smith@example.com",
            "full_name": "Jane Smith",
            "password": "Test123!",
            "is_online": False
        },
        {
            "email": "alice.johnson@example.com",
            "full_name": "Alice Johnson",
            "password": "Test123!",
            "is_online": True
        },
        {
            "email": "bob.wilson@example.com",
            "full_name": "Bob Wilson",
            "password": "Test123!",
            "is_online": False
        },
        {
            "email": "charlie.brown@example.com",
            "full_name": "Charlie Brown",
            "password": "Test123!",
            "is_online": True
        }
    ]
    
    created_users = []
    for user_data in users_data:
        # Check if user already exists
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            print(f"  ✓ User {user_data['email']} already exists")
            created_users.append(existing)
            continue
        
        user = User(
            email=user_data["email"],
            full_name=user_data["full_name"],
            hashed_password=get_password_hash(user_data["password"]),
            is_active=True,
            is_verified=True,
            is_online=user_data["is_online"],
        )
        db.add(user)
        created_users.append(user)
        print(f"  ✓ Created user: {user_data['email']}")
    
    db.commit()
    print(f"✓ Created {len(created_users)} users\n")
    return created_users


def create_test_call_history(db: Session, users: list):
    """Create sample call history"""
    print("Creating test call history...")
    
    risk_levels = ["LOW", "MEDIUM", "HIGH"]
    
    # Create 10 sample calls
    for i in range(10):
        # Random caller and callee
        caller = random.choice(users)
        callee = random.choice([u for u in users if u.id != caller.id])
        
        # Random time in past 7 days
        days_ago = random.randint(0, 7)
        hours_ago = random.randint(0, 23)
        started_at = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)
        connected_at = started_at + timedelta(seconds=random.randint(2, 10))
        duration = random.randint(30, 600)  # 30 seconds to 10 minutes
        ended_at = connected_at + timedelta(seconds=duration)
        
        # Random risk level
        risk_level = random.choice(risk_levels)
        risk_score = {
            "LOW": random.randint(0, 30),
            "MEDIUM": random.randint(31, 70),
            "HIGH": random.randint(71, 100)
        }[risk_level]
        
        synthetic_confidence = random.randint(0, 100)
        model_confidence = random.randint(80, 99)
        
        recommendations = {
            "LOW": "This voice appears to be human. No suspicious patterns detected.",
            "MEDIUM": "Voice shows some characteristics that may indicate AI generation. Proceed with caution.",
            "HIGH": "This voice is likely AI-generated. Exercise extreme caution with this caller."
        }
        
        call = CallHistory(
            call_id=f"call-{datetime.utcnow().timestamp()}-{i}",
            caller_id=caller.id,
            callee_id=callee.id,
            started_at=started_at,
            connected_at=connected_at,
            ended_at=ended_at,
            duration=duration,
            final_state="ended",
            risk_level=risk_level,
            risk_score=risk_score,
            synthetic_confidence=synthetic_confidence,
            model_confidence=model_confidence,
            recommendation=recommendations[risk_level],
            acoustic_indicators={
                "pitch_variance": round(random.uniform(0.1, 0.9), 2),
                "spectral_flux": round(random.uniform(0.2, 0.8), 2),
                "zero_crossing_rate": round(random.uniform(0.1, 0.6), 2)
            },
            prosody_indicators={
                "speech_rate": round(random.uniform(2.0, 4.5), 2),
                "pause_duration": round(random.uniform(0.1, 0.5), 2),
                "intonation_pattern": round(random.uniform(0.3, 0.8), 2)
            }
        )
        
        db.add(call)
        print(f"  ✓ Created call: {caller.full_name} → {callee.full_name} ({risk_level})")
    
    db.commit()
    print(f"✓ Created 10 call history records\n")


def main():
    """Main function to create test data"""
    print("=" * 60)
    print("VoiceShield - Creating Test Data")
    print("=" * 60)
    print()
    
    # Create tables
    print("Creating database tables...")
    create_tables()
    print("✓ Tables created\n")
    
    # Get database session
    db = SessionLocal()
    
    try:
        # Create users
        users = create_test_users(db)
        
        # Create call history
        create_test_call_history(db, users)
        
        print("=" * 60)
        print("✓ Test Data Created Successfully!")
        print("=" * 60)
        print()
        print("Test Users Created:")
        print("-" * 60)
        for user in users:
            status = "🟢 Online" if user.is_online else "⚫ Offline"
            print(f"  {status} {user.full_name}")
            print(f"    Email: {user.email}")
            print(f"    Password: Demo123! or Test123!")
            print()
        
        print("You can now:")
        print("  1. Start the backend: python run.py")
        print("  2. Login with any test user")
        print("  3. View API docs: http://localhost:8000/docs")
        print()
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
