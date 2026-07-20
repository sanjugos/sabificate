#!/bin/bash
# Start SABIficate Fastify backend in production mode
# Uses persistent PostgreSQL (gogood/sabificate schema on host)

set -a
source "$(dirname "$0")/.env.production"
set +a

exec npx tsx server/api/server.ts
