# Kalki

> **Open-source AI short-video studio. A five-agent pipeline turns a one-line idea into a finished vertical video: script, scene art, voiceover, animation, edit.**

[![CI](https://github.com/harshitwandhare/kalki/actions/workflows/ci.yml/badge.svg)](https://github.com/harshitwandhare/kalki/actions/workflows/ci.yml)
[![CodeQL](https://github.com/harshitwandhare/kalki/actions/workflows/codeql.yml/badge.svg)](https://github.com/harshitwandhare/kalki/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/harshitwandhare/kalki/badge)](https://securityscorecards.dev/viewer/?uri=github.com/harshitwandhare/kalki)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

Kalki runs on your own machine with your own API keys. You describe a topic, a
LangGraph director coordinates specialised agents, and you get a finished 9:16
video plus title, description and tags, ready to review and upload.

## How it works

```
prompt -> Director -> Screenwriter -> Artist -> Animator -> Producer -> reel + metadata
          (LangGraph)    script        images     video      FFmpeg
```

| Agent        | Job                                                                 |
| ------------ | ------------------------------------------------------------------- |
| Director     | Orchestrates the run, researches the topic, falls back between LLMs |
| Screenwriter | Writes the script, hook and platform metadata                       |
| Artist       | Generates a scene image per beat (Stability AI)                     |
| Animator     | Animates scenes with Seedance or Kling, using character references  |
| Producer     | Merges video and voiceover (ElevenLabs), labels the file, thumbnail |

Around the pipeline:

- **Channels, characters and worlds** with pgvector similarity search, so a recurring
  cast and setting stay consistent across episodes.
- **Live dashboard** with real-time agent logs over Server-Sent Events.
- **Role-based access** (owner, editor, viewer) with admin approval for new sign-ups.
- **Optional WhatsApp control** through a gateway you run yourself.

## Responsible use

Kalki produces synthetic media, and it is built to say so:

- Every output file is tagged `AI-generated` in its container metadata. Kalki does not
  strip provenance data (such as C2PA or SynthID signals) and does not fake camera or
  device metadata.
- You are responsible for disclosing AI-generated content on the platform you publish
  to (for example YouTube's "altered or synthetic content" setting) and for following
  its policies and the law where you live.
- Kalki only uses API keys that **you** supply. It does not create accounts, solve
  CAPTCHAs, rotate proxies or otherwise work around any provider's terms.
- Do not use it to impersonate real people or to mass-produce spam.

## Quick start

Requirements: [Bun](https://bun.sh) 1.3+, Node 20+, Docker, FFmpeg.

```bash
git clone https://github.com/harshitwandhare/kalki && cd kalki
cp .env.example .env.local        # fill in AUTH_SECRET, DATABASE_URL, API keys
bun install
bun run db:up                     # PostgreSQL 16 + pgvector on 127.0.0.1:5432
bunx prisma migrate deploy
SEED_OWNER_EMAIL=you@example.com SEED_OWNER_PASSWORD='a-long-password' bun run db:seed
bun run dev                       # http://localhost:3000
```

Export `POSTGRES_PASSWORD` in your shell, set to the same password used in
`DATABASE_URL`, before running `bun run db:up`.

### Configuration

All variables are documented in [`.env.example`](.env.example). You need at least one
LLM key (Anthropic or Google) plus keys for the media providers you want to use:
Stability AI (images), ElevenLabs (voice), and Seedance or Kling (video).

## Development

```bash
bun run check          # lint + type-check + tests
bun run format         # prettier
bun run db:studio      # browse the database
```

Commits follow [Conventional Commits](https://conventionalcommits.org) and are
checked by commitlint through Husky. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Project layout

```
src/agents/director.ts     LangGraph pipeline (all agent nodes)
src/services/              image, video, audio, ffmpeg, embeddings, SSE
src/app/api/               REST + SSE + WhatsApp webhook
src/app/(dashboard)/       dashboard pages
prisma/                    schema, migrations, seed
tests/                     vitest
```

## Security

Report vulnerabilities privately, see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
