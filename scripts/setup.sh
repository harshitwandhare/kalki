#!/usr/bin/env bash
# One-command local setup: checks tools, writes .env.local with fresh secrets,
# starts Postgres, applies migrations and creates your owner account.
# Usage: bash scripts/setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing $1. $2"; exit 1; }; }
need bun "Install it from https://bun.sh"
need docker "Install Docker Desktop or Docker Engine."
command -v ffmpeg >/dev/null 2>&1 || echo "Note: ffmpeg not found. Install it before generating videos."

rand() { bun -e "console.log(require('crypto').randomBytes($1).toString('base64url'))"; }

if [ ! -f .env.local ]; then
  pg_pass="$(rand 18)"
  cp .env.example .env.local
  sed -i.bak \
    -e "s|^DATABASE_URL=.*|DATABASE_URL=\"postgresql://kalki:${pg_pass}@localhost:5432/kalki_db\"|" \
    -e "s|^AUTH_SECRET=.*|AUTH_SECRET=\"$(rand 32)\"|" \
    -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=\"${pg_pass}\"|" \
    .env.local && rm -f .env.local.bak
  echo "Wrote .env.local with new secrets."
else
  echo "Using existing .env.local."
fi

# shellcheck disable=SC1091
set -a; . ./.env.local; set +a

if [ -z "${GOOGLE_GENERATIVE_AI_API_KEY:-}" ]; then
  read -r -p "Gemini API key (https://aistudio.google.com/app/apikey, Enter to skip): " key
  if [ -n "$key" ]; then
    sed -i.bak "s|^GOOGLE_GENERATIVE_AI_API_KEY=.*|GOOGLE_GENERATIVE_AI_API_KEY=\"${key}\"|" .env.local && rm -f .env.local.bak
  fi
fi

bun install
POSTGRES_PASSWORD="$POSTGRES_PASSWORD" docker compose -f docker/docker-compose.yml up -d postgres
echo "Waiting for Postgres..."
until docker exec kalki_postgres pg_isready -U kalki >/dev/null 2>&1; do sleep 2; done
bunx prisma generate >/dev/null
bunx prisma migrate deploy

if [ -z "${SEED_OWNER_EMAIL:-}" ]; then read -r -p "Owner email: " SEED_OWNER_EMAIL; fi
if [ -z "${SEED_OWNER_PASSWORD:-}" ]; then read -r -s -p "Owner password (12+ characters): " SEED_OWNER_PASSWORD; echo; fi
SEED_OWNER_EMAIL="$SEED_OWNER_EMAIL" SEED_OWNER_PASSWORD="$SEED_OWNER_PASSWORD" bun run db:seed

echo
echo "Done. Start Kalki with: bun run dev   (then open http://localhost:3000)"
