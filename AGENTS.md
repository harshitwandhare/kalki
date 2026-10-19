# AGENTS.md

Context for AI coding agents working in this repo.

## Stack

Bun, Next.js 16 (App Router), Prisma 7 with `@prisma/adapter-pg`, PostgreSQL 16 +
pgvector, LangGraph.js, NextAuth v5, Tailwind 4, shadcn/ui.

## Rules

- Import Prisma from `@/generated/prisma/client`, never `@prisma/client`.
- Package manager is `bun`. Gate: `bun run check` and `bun run format:check`.
- Every LLM call goes through `invokeWithFallback()` in `src/agents/director.ts`.
- API routes export `dynamic = "force-dynamic"` and check roles with `src/lib/rbac.ts`.
- Commits use Conventional Commits.

## Hard limits

Do not add: account-creation or CAPTCHA/bot-evasion automation, stripping or faking
of provenance metadata, shell execution from request input, or committed secrets or
personal data. `tests/policy.test.ts` guards some of these.
