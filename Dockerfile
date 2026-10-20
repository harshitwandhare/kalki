# Kalki studio image: Next.js app + Prisma + FFmpeg.
# docker compose -f docker/docker-compose.yml --profile app up -d --build
FROM node:22-bookworm-slim AS base
RUN npm install -g bun@1.3.9

FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build \
    AUTH_SECRET=build-only-secret-not-used-at-runtime \
    NEXT_TELEMETRY_DISABLED=1
RUN bunx prisma generate && bun run build

FROM base AS run
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=build --chown=node:node /app ./
USER node
RUN mkdir -p public/videos public/images public/audio
EXPOSE 3000
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run start"]
