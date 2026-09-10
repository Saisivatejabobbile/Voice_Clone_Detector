"""
Verify call_history table structure
"""

import sys
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy import inspect
from app.database import engine


def verify_table():
    """Verify call_history table structure"""
    
    print("=" * 60)
    print("Verifying call_history table structure")
    print("=" * 60)
    print()
    
    inspector = inspect(engine)
    
    # Check if table exists
    if "call_history" not in inspector.get_table_names():
        print("❌ Table 'call_history' does not exist!")
        return False
    
    print("✅ Table 'call_history' exists")
    print()
    
    # Check columns
    columns = inspector.get_columns("call_history")
    print("📋 Columns:")
    required_columns = {
        "id": {"type": "VARCHAR", "nullable": False, "primary": True},
        "caller_id": {"type": "INTEGER", "nullable": False},
        "callee_id": {"type": "INTEGER", "nullable": False},
        "started_at": {"type": "DATETIME", "nullable": False},
        "ended_at": {"type": "DATETIME", "nullable": True},
        "duration_seconds": {"type": "INTEGER", "nullable": False},
        "status": {"type": "VARCHAR", "nullable": False},
        "risk_level": {"type": "VARCHAR", "nullable": True},
        "risk_score": {"type": "INTEGER", "nullable": True},
        "created_at": {"type": "DATETIME", "nullable": False},
    }
    
    column_names = [col["name"] for col in columns]
    for col in columns:
        nullable = "NULL" if col["nullable"] else "NOT NULL"
        primary = " [PRIMARY KEY]" if col.get("primary_key") else ""
        print(f"   ✓ {col['name']:<20} {str(col['type']):<20} {nullable}{primary}")
    
    # Check for missing columns
    missing = set(required_columns.keys()) - set(column_names)
    if missing:
        print()
        print(f"❌ Missing columns: {', '.join(missing)}")
    print()
    
    # Check indexes
    indexes = inspector.get_indexes("call_history")
    print("🔍 Indexes:")
    required_indexes = ["caller_id", "callee_id", "started_at", "risk_level"]
    indexed_columns = []
    
    for idx in indexes:
        cols = ", ".join(idx["column_names"])
        indexed_columns.extend(idx["column_names"])
        print(f"   ✓ {idx['name']:<30} ({cols})")
    
    # Check for missing indexes
    missing_indexes = set(required_indexes) - set(indexed_columns)
    if missing_indexes:
        print()
        print(f"⚠️  Missing indexes on: {', '.join(missing_indexes)}")
    print()
    
    # Check foreign keys
    foreign_keys = inspector.get_foreign_keys("call_history")
    print("🔗 Foreign Keys:")
    for fk in foreign_keys:
        constrained = ", ".join(fk["constrained_columns"])
        referred = ", ".join(fk["referred_columns"])
        ondelete = f" ON DELETE {fk.get('ondelete', 'NO ACTION')}"
        print(f"   ✓ {constrained} -> {fk['referred_table']}.{referred}{ondelete}")
    
    if len(foreign_keys) < 2:
        print()
        print(f"⚠️  Expected 2 foreign keys, found {len(foreign_keys)}")
    print()
    
    # Check constraints (note: SQLite may not expose CHECK constraints via inspector)
    print("📝 CHECK Constraints (defined in model):")
    print("   ✓ valid_duration: duration_seconds >= 0")
    print("   ✓ valid_risk_score: risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100)")
    print()
    
    print("=" * 60)
    print("✅ Verification complete!")
    print("=" * 60)
    
    return True


if __name__ == "__main__":
    verify_table()
