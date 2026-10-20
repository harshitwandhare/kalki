# Deployment

## Self-hosting the studio

The studio needs a long-running Node process, PostgreSQL with pgvector, FFmpeg and disk space for output files. One small VM is enough.

```bash
bun install --frozen-lockfile
bunx prisma migrate deploy
bun run build
bun run start        # listens on port 3000
```

- Put it behind a reverse proxy such as Caddy or nginx with HTTPS, and set `AUTH_URL` to the public address.
- Keep `public/videos`, `public/images` and `public/audio` on persistent disk.
- Run one instance, because the SSE event bus lives in memory.
- Back up the database with `pg_dump` on a schedule.

Serverless hosts are a poor fit for the studio itself. Generation runs for minutes in the background, FFmpeg needs a native binary, and outputs are written to local disk.

## The public site

The landing page and these docs are deployed to Vercel with `KALKI_SITE_ONLY=1`, which turns every app route into a redirect home, so no database is needed. Vercel deploys every push to `main`.

## Releases

Releases are cut from tags. Bump `version` in `package.json`, add a section to `CHANGELOG.md`, merge, then:

```bash
git tag v0.3.0
git push origin v0.3.0
```

The `Release` workflow runs the checks and the build, then publishes a GitHub Release with that version's changelog section as its notes.
