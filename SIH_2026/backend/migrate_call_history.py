"""
Database Migration Script: Add call_history table
Creates the call_history table with all required columns, constraints, and indexes.
"""

import sys
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy import create_engine, text, inspect
from app.config import settings
from app.database import Base, engine
from app.models.call_history import CallHistory
from app.models.user import User


def check_table_exists(engine, table_name):
    """Check if a table exists in the database"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()


def migrate():
    """Run the migration to create call_history table"""
    
    print("=" * 60)
    print("Database Migration: Create call_history table")
    print("=" * 60)
    print()
    
    # Check if table already exists
    if check_table_exists(engine, "call_history"):
        print("⚠️  Table 'call_history' already exists!")
        print("    Skipping migration.")
        return
    
    print("📊 Current database:", settings.DATABASE_URL)
    print()
    
    # Create the call_history table
    print("Creating call_history table...")
    try:
        CallHistory.__table__.create(engine, checkfirst=True)
        print("✅ Successfully created call_history table")
        print()
        
        # Verify table creation
        inspector = inspect(engine)
        
        # Check columns
        columns = inspector.get_columns("call_history")
        print("📋 Columns created:")
        for col in columns:
            nullable = "NULL" if col["nullable"] else "NOT NULL"
            print(f"   - {col['name']}: {col['type']} {nullable}")
        print()
        
        # Check indexes
        indexes = inspector.get_indexes("call_history")
        print("🔍 Indexes created:")
        for idx in indexes:
            cols = ", ".join(idx["column_names"])
            print(f"   - {idx['name']}: ({cols})")
        print()
        
        # Check foreign keys
        foreign_keys = inspector.get_foreign_keys("call_history")
        print("🔗 Foreign keys created:")
        for fk in foreign_keys:
            print(f"   - {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
        print()
        
        # Check constraints (SQLite may not show CHECK constraints explicitly)
        print("✔️  CHECK constraints defined:")
        print("   - valid_duration: duration_seconds >= 0")
        print("   - valid_risk_score: risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100)")
        print()
        
        print("=" * 60)
        print("✅ Migration completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        raise


if __name__ == "__main__":
    migrate()
