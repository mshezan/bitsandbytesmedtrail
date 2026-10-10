#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Seeding demo data..."
python -m seed.seed

echo "Starting API..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --no-access-log
