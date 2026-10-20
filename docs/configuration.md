# Configuration

Kalki reads environment variables from `.env.local`. The core block and the Gemini key are required. Each media provider is optional, and its stage is skipped or falls back when the key is missing.

## Core

| Variable       | Required      | What it does                                                                                         |
| -------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | yes           | PostgreSQL connection string. The database needs the `vector` extension, which the Docker image has. |
| `AUTH_SECRET`  | yes           | Signs session tokens. Generate with `openssl rand -base64 32`.                                       |
| `AUTH_URL`     | in production | The public URL of the app.                                                                           |
| `FFMPEG_PATH`  | no            | Path to `ffmpeg`. Defaults to `ffmpeg` on `PATH`.                                                    |

## Language model

| Variable                       | Required | What it does                                                                                      |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------------------- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | yes      | Gemini 2.5 Pro for research, script and metadata, and `text-embedding-004` for similarity search. |

## Media providers

| Variable             | Stage    | Provider                                      |
| -------------------- | -------- | --------------------------------------------- |
| `STABILITY_API_KEY`  | Artist   | Stability AI image generation                 |
| `ELEVENLABS_API_KEY` | Producer | ElevenLabs text to speech                     |
| `SEEDANCE_API_KEY`   | Animator | Seedance 2.0, preferred when set              |
| `KLING_API_KEY`      | Animator | Kling, used when Seedance is missing or fails |

Kalki only calls these providers with keys you supply, under your own account and its terms.

## WhatsApp control (optional)

| Variable                | What it does                                                     |
| ----------------------- | ---------------------------------------------------------------- |
| `KALKI_WEBHOOK_SECRET`  | Shared secret your gateway sends in the `x-kalki-secret` header. |
| `WHATSAPP_OWNER_NUMBER` | The only number allowed to send commands, digits only.           |

Both must be set or `/api/whatsapp` answers 503. See [API](/docs/api).

## Seeding and Docker

| Variable              | What it does                                        |
| --------------------- | --------------------------------------------------- |
| `SEED_OWNER_EMAIL`    | Email for the owner account the seed creates.       |
| `SEED_OWNER_PASSWORD` | Its password, 12 characters or more.                |
| `POSTGRES_PASSWORD`   | Password for the Docker Compose database. Required. |

## Site-only mode

| Variable          | What it does                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| `KALKI_SITE_ONLY` | Set to `1` to serve only the landing page and docs. Every app route redirects home. The public site runs this way. |
