import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy import text
from app.database import engine

with engine.connect() as conn:
    result = conn.execute(text('PRAGMA foreign_keys'))
    print(f'Foreign keys enabled: {result.scalar()}')
