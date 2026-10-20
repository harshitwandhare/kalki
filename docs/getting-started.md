# Getting started

Kalki runs on your own machine. You need four things installed:

- [Bun](https://bun.sh) 1.3 or newer
- Docker, for PostgreSQL with pgvector
- FFmpeg on your `PATH`, or its path in `FFMPEG_PATH`
- A Google Gemini API key

## 1. Clone and install

```bash
git clone https://github.com/harshitwandhare/kalki && cd kalki
bun install
```

## 2. Configure

```bash
cp .env.example .env.local
```

Open `.env.local` and set at least `DATABASE_URL`, `AUTH_SECRET` (run `openssl rand -base64 32`) and `GOOGLE_GENERATIVE_AI_API_KEY`. Every variable is described in [Configuration](/docs/configuration).

## 3. Start the database

The compose file binds Postgres to `127.0.0.1` and refuses to start without a password, so export one that matches `DATABASE_URL` first:

```bash
export POSTGRES_PASSWORD=change-me
bun run db:up
bunx prisma migrate deploy
```

## 4. Create the owner account and demo channels

```bash
SEED_OWNER_EMAIL=you@example.com SEED_OWNER_PASSWORD='a-long-password' bun run db:seed
```

The seed creates your owner login and three demo channels (Viral India, Parent Pulse and Karma Reels), each with two characters and a world.

## 5. Run it

```bash
bun run dev
```

Open http://localhost:3000, sign in, and go to **Generate**. Write a one-line prompt, pick a channel and press **Generate Reel**. The live agent feed shows each stage as it runs. Finished files land in `public/videos`.

## Production

```bash
bun run build
bun run start
```

Run it behind a reverse proxy with HTTPS and set `AUTH_URL` to the public address. See [Deployment](/docs/deployment).
