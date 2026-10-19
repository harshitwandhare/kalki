# Security Policy

## Supported versions

Kalki is pre-1.0; security fixes land on `main`.

## Reporting a vulnerability

Please do not open a public issue for security problems. Report privately through
[GitHub Security Advisories](https://github.com/harshitwandhare/kalki/security/advisories/new)
("Report a vulnerability" on the Security tab), or email <harshitwandhare45@gmail.com>.
You will get an acknowledgement within 72 hours.

## Security model

Kalki is self-hosted and single-tenant.

- **Secrets** live in `.env.local` (git-ignored). The repo ships only `.env.example`.
- **Auth**: NextAuth v5 with bcrypt-hashed passwords. New sign-ups are `PENDING` until
  an owner approves them. Admin and settings routes require the `OWNER` role.
- **WhatsApp webhook** is disabled unless both `KALKI_WEBHOOK_SECRET` and
  `WHATSAPP_OWNER_NUMBER` are set. The secret is compared in constant time and the
  sender must match the owner number exactly. The webhook can only start generations
  and read status; it cannot run shell commands.
- **Database** is bound to `127.0.0.1` in the provided Docker Compose file and has no
  default password.

## Automated defenses in CI

gitleaks secret scan (full history), CodeQL, OpenSSF Scorecard, dependency audit,
and weekly Dependabot updates with SHA-pinned GitHub Actions.
