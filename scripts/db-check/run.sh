#!/usr/bin/env bash
# ทดสอบว่า supabase/migrations/000 → 014 + seed รันต่อกันบน DB เปล่าได้จริง
#   ต้องมี: docker, psql   ·   ใช้: bash scripts/db-check/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

IMAGE=supabase/postgres:15.8.1.085
NAME=rod2buy-db-check
PORT=${PORT:-54329}
export PGPASSWORD=postgres
export PGOPTIONS="-c client_min_messages=warning"
PSQL=(psql -h localhost -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)

docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -e POSTGRES_PASSWORD=postgres -p "$PORT:5432" "$IMAGE" >/dev/null
trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT

echo "รอ Postgres…"
for _ in $(seq 1 60); do "${PSQL[@]}" -c 'select 1' >/dev/null 2>&1 && break; sleep 2; done

# auth / storage เป็นของ supabase_admin
psql -h localhost -p "$PORT" -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -q -f scripts/db-check/supabase-stubs.sql

run() { echo "→ $1"; "${PSQL[@]}" -f "$1"; }

for f in supabase/migrations/*.sql; do run "$f"; done

echo "→ รันซ้ำทุก migration (ต้องรันซ้ำได้)"
for f in supabase/migrations/0[0-9][1-9]_*.sql supabase/migrations/01*.sql; do "${PSQL[@]}" -f "$f" >/dev/null; done

# seed ต้องมี admin อย่างน้อย 1 คน
"${PSQL[@]}" <<'SQL'
INSERT INTO auth.users (id, email, aud, role) VALUES
  ('00000000-0000-4000-8000-0000000000ad', 'admin@db-check.test', 'authenticated', 'authenticated');
INSERT INTO public.profiles (id, display_name, role) VALUES
  ('00000000-0000-4000-8000-0000000000ad', 'admin', 'admin');
SQL

run supabase/seed.sql
echo "→ รัน seed แบบแบ่งไฟล์ซ้ำ (ต้องรันซ้ำได้)"
for f in supabase/seed/*.sql; do "${PSQL[@]}" -f "$f" >/dev/null; done

"${PSQL[@]}" -At <<'SQL'
SELECT 'listings: '      || count(*) FROM public.listings;
SELECT 'active: '        || count(*) FROM public.listings WHERE status = 'active';
SELECT 'car_events: '    || count(*) FROM public.car_events;
SELECT 'price_estimates: '|| count(*) FROM public.price_estimates;
SELECT 'seller_scores: ' || count(*) FROM public.seller_scores;
SQL
echo "→ smoke test RLS (anon / ผู้ขาย / ผู้ซื้อ / ผู้ใช้ใหม่)"
"${PSQL[@]}" -o /dev/null -f scripts/db-check/smoke.sql
echo "✓ ผ่าน"
