# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Simpler logo: three lines crossed by an open eye, flat, used everywhere. The 3D
  render and its script are gone.

## [0.3.0] - 2026-10-20

### Added

- Public website at `/` with a live channel switcher, a pipeline diagram, real
  screenshots and a recorded walkthrough of the studio. The studio moved to `/dashboard`.
- Documentation site at `/docs`, rendered from `docs/*.md`: getting started,
  configuration, pipeline, architecture, API, deployment, publishing, earning and
  responsible use.
- Platform presets for YouTube Shorts, TikTok, Instagram Reels, Facebook Reels,
  Snapchat Spotlight, Pinterest, X and LinkedIn. The Library writes a caption that
  fits each one and shows where its AI disclosure setting is.
- 75 and 90 second reel lengths.
- `bun run setup` for one-command local setup, a Dockerfile, and an `app` profile
  in Docker Compose.
- `KALKI_SITE_ONLY=1` mode for hosting the website without a database.
- Settings shows which provider keys are actually configured.
- New logo: the tripundra crossed by the third eye, rendered in 3D.
- Playwright end-to-end suites for the site and for the full app with a seeded
  database, run in CI. Release workflow that publishes notes from this file.
- Security headers on every response.

### Fixed

- Several API routes had no auth check, including `/api/agents/generate`, which
  spends provider credits. Every route now goes through `guard()`.
- The length picked on Generate never reached the Screenwriter.
- `@google/generative-ai` was only installed through a package that is no longer a
  dependency, so clean installs failed to build.
- Docs and UI claimed a Claude fallback that the pipeline does not have. Gemini is
  the only LLM, and the docs now say so.
- Dashboard labels named the wrong image model.

### Removed

- Unused dependencies: `@ai-sdk/anthropic`, `@langchain/anthropic`,
  `@langchain/google-genai`, `together-ai`, `edge-tts-universal`,
  `@auth/prisma-adapter`.

## [0.2.0] - 2026-10-19

First public release.

### Removed

- Early prototype code that worked around provider sign-up and content-labelling rules,
  and the `BYPASS_MODE` switch. Kalki now only uses keys you supply and keeps every
  output labelled as AI-generated.
- WhatsApp shell commands (`build`, `deploy`, `commit`, `push`, `pull`, `logs`).
- Personal paths, phone numbers and the hard-coded seed password.

### Added

- `AI-generated` provenance tag on every output file.
- Fail-closed, constant-time authentication on the WhatsApp webhook.
- CI (lint, format, types, tests, build, migrations, gitleaks, audit), CodeQL,
  Scorecard, Dependabot, community files, MIT license.
- Migration dropping the removed automation tables.

[Unreleased]: https://github.com/harshitwandhare/kalki/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/harshitwandhare/kalki/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/harshitwandhare/kalki/releases/tag/v0.2.0
