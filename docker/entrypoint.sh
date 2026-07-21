#!/bin/sh
# Container entrypoint for the scrum-poker Next.js standalone server (issue #17).
#
# 1. Optionally apply pending Prisma migrations against DATABASE_URL using the
#    lean toolkit staged at /app/migrate (packages/db schema + migrations).
#    Toggle with RUN_MIGRATIONS (default: true). Set RUN_MIGRATIONS=false to
#    skip — e.g. when a dedicated migration job owns the schema.
# 2. Start the Next.js standalone Node server. In a pnpm monorepo the standalone
#    output places the entry at apps/web/server.js (traced from the repo root).
#
# A long-lived Node runtime is required for the SSE + Postgres LISTEN/NOTIFY
# realtime transport, so we `exec` the server as PID 1 for clean signal handling.
set -e

RUN_MIGRATIONS="${RUN_MIGRATIONS:-true}"

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "[entrypoint] RUN_MIGRATIONS=true — applying database migrations (prisma migrate deploy)..."
  cd /app/migrate
  node_modules/.bin/prisma migrate deploy
  cd /app
  echo "[entrypoint] Migrations applied."
else
  echo "[entrypoint] RUN_MIGRATIONS=$RUN_MIGRATIONS — skipping migrations."
fi

echo "[entrypoint] Starting Next.js standalone server (node apps/web/server.js)..."
exec node apps/web/server.js
