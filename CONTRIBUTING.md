# Contributing to Kalki

Thanks for helping. Please read the [Code of Conduct](CODE_OF_CONDUCT.md) first.

## Setup

Follow the Quick start in the [README](README.md), then:

```bash
bun run check && bun run format:check
```

All of it must pass before you open a PR; CI runs the same commands.

## Commits and branches

- [Conventional Commits](https://conventionalcommits.org): `feat:`, `fix:`, `docs:`,
  `refactor:`, `test:`, `chore:`. Husky and commitlint enforce this.
- Branch from `main` as `feat/...`, `fix/...`, `docs/...`.

## Pull requests

- Keep them focused and add tests for new behavior.
- Update `CHANGELOG.md` under `[Unreleased]` for user-visible changes.

## Out of scope

Contributions will not be merged if they add:

- automation that creates accounts, evades bot detection or CAPTCHAs, or otherwise
  works around a provider's terms of service
- code that strips or forges provenance or AI-disclosure metadata
- anything that executes shell commands from network input

## Security issues

Do not file them publicly. See [SECURITY.md](SECURITY.md).
