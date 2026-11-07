#!/usr/bin/env bash
# Runs the agent API against real Postgres + PostgREST in Docker:
# plain Postgres with a Supabase shim, the production applications table,
# then the real migrations under test.
#
#   supabase/functions/agent-api/integration/run.sh
set -euo pipefail
cd "$(dirname "$0")"

MIGRATIONS=../../../migrations
NET=agent-api-it
PG=agent-api-it-pg
REST=agent-api-it-rest
PORT=${AGENT_API_IT_PORT:-54399}
SECRET=agent-api-integration-test-secret-0123456789

cleanup() {
  docker rm -f "$PG" "$REST" >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
}
trap cleanup EXIT
cleanup

docker network create "$NET" >/dev/null
docker run -d --name "$PG" --network "$NET" -e POSTGRES_PASSWORD=postgres postgres:16-alpine >/dev/null

# The image restarts the server once after init; wait for that to finish.
until docker logs "$PG" 2>&1 | grep -q 'PostgreSQL init process complete'; do sleep 0.5; done
until docker exec "$PG" pg_isready -U postgres -q; do sleep 0.5; done

psql() { docker exec -i "$PG" psql -U postgres -v ON_ERROR_STOP=1 -q; }
psql < supabase_shim.sql
psql < base_schema.sql
psql < "$MIGRATIONS/20260522_create_api_keys.sql"
psql < "$MIGRATIONS/20261107_application_events_and_soft_delete.sql"

docker run -d --name "$REST" --network "$NET" -p "$PORT:3000" \
  -e PGRST_DB_URI="postgres://authenticator:authenticator@$PG:5432/postgres" \
  -e PGRST_DB_SCHEMAS=public \
  -e PGRST_DB_ANON_ROLE=anon \
  -e PGRST_JWT_SECRET="$SECRET" \
  postgrest/postgrest:v12.2.3 >/dev/null
until curl -sf "http://localhost:$PORT/" >/dev/null; do sleep 0.5; done

AGENT_API_IT_URL="http://localhost:$PORT" AGENT_API_IT_JWT_SECRET="$SECRET" \
  deno test --allow-net=localhost --allow-env integration.test.ts
