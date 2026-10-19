# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.2.0] - 2026-10-19

First public release.

### Removed

- Free-tier account "farming" (disposable email, CAPTCHA solving, stealth browser,
  proxy rotation) and the `BYPASS_MODE` switch. Kalki now only uses keys you supply.
- The "evasion engine": metadata stripping, fake device metadata and camera-grain
  effects meant to avoid AI-content detection.
- WhatsApp shell commands (`build`, `deploy`, `commit`, `push`, `pull`, `logs`).
- Personal paths, phone numbers and the hard-coded seed password.

### Added

- `AI-generated` provenance tag on every output file.
- Fail-closed, constant-time authentication on the WhatsApp webhook.
- CI (lint, format, types, tests, build, migrations, gitleaks, audit), CodeQL,
  Scorecard, Dependabot, community files, MIT license.
- Migration dropping the removed automation tables.
