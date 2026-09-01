#!/bin/sh
set -e

python - <<'PY'
import os
import time

import pymysql

host = os.environ.get("MYSQL_HOST", "mysql")
port = int(os.environ.get("MYSQL_PORT", "3306"))
user = os.environ.get("MYSQL_USER", "ledger")
password = os.environ.get("MYSQL_PASSWORD", "ledger")
database = os.environ.get("MYSQL_DATABASE", "breakthrough_ledger")

for attempt in range(60):
    try:
        conn = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            connect_timeout=3,
        )
        conn.close()
        print("MySQL is ready.")
        break
    except Exception as err:
        print(f"Waiting for MySQL ({attempt + 1}/60): {err}")
        time.sleep(2)
else:
    raise SystemExit("MySQL did not become ready in time.")
PY

python - <<'PY'
from app.database import Base, engine, ensure_schema

Base.metadata.create_all(bind=engine)
ensure_schema()
print("Schema ready.")
PY

SEED_NEEDED=$(python - <<'PY'
from sqlalchemy import func
from app.database import SessionLocal
from app.models import Technology

db = SessionLocal()
try:
    print(db.query(func.count(Technology.id)).scalar() or 0)
finally:
    db.close()
PY
)

SEED_MODE=${SEED_MODE:-static}

if [ "$SEED_NEEDED" != "0" ]; then
  echo "Database already has $SEED_NEEDED technologies — skipping seed."
elif [ "$SEED_MODE" = "skip" ]; then
  echo "SEED_MODE=skip — not seeding."
elif [ "$SEED_MODE" = "full" ]; then
  echo "Empty database. Downloading prices and scoring (several minutes)…"
  python seed/seed.py
else
  echo "Empty database. Loading MIT lists and mappings (no live prices)…"
  python seed/seed.py --static-only
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
