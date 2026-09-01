#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
docker compose up -d mysql
echo "Waiting for MySQL…"
for i in $(seq 1 40); do
  if docker compose exec -T mysql mysqladmin ping -h 127.0.0.1 -uledger -pledger --silent 2>/dev/null; then
    break
  fi
  # user is created after init; root ping is enough
  if docker compose exec -T mysql mysqladmin ping -h 127.0.0.1 -uroot -pledger_root --silent; then
    docker compose exec -T mysql mysql -uroot -pledger_root -e "SELECT 1" >/dev/null 2>&1 && break
  fi
  sleep 2
done
