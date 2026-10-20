# Architecture

Kalki is one Next.js 16 application. The dashboard, the REST API, the Server-Sent Events stream and the agent pipeline all run in the same Node process, backed by PostgreSQL.

```
browser -> dashboard pages -> /api/* route handlers -> Prisma -> PostgreSQL + pgvector
                                   |
                                   +- /api/agents/generate -> startPipeline() -> LangGraph director
                                   |                                                  |
                                   +- /api/sse?reelId=  <-  emitAgentEvent()  <-------+
```

## Layers

| Layer       | Where                             | Notes                                                                              |
| ----------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| Pages       | `src/app/(dashboard)`             | Client components that call the API and subscribe to SSE.                          |
| Public site | `src/app/(site)`                  | The landing page and these docs. Renders without a database.                       |
| API         | `src/app/api`                     | Route handlers. Each checks the session with `guard()` from `src/lib/api-auth.ts`. |
| Auth        | `src/lib/auth.ts`, `src/proxy.ts` | NextAuth v5 credentials, JWT sessions, role and status checks before pages render. |
| Pipeline    | `src/agents/director.ts`          | The LangGraph graph with all five nodes.                                           |
| Services    | `src/services`                    | One file per provider, plus FFmpeg, embeddings and SSE.                            |
| Data        | `prisma/schema.prisma`            | Users, channels, characters, worlds, reels and agent logs.                         |

## Data model

- **User** has a role (`OWNER`, `EDITOR`, `VIEWER`) and a status (`PENDING`, `ACTIVE`, `REJECTED`). New sign-ups start as pending viewers.
- **Channel** belongs to a user and carries theme, audience, language and a config with hooks and default style.
- **Character** belongs to a channel and holds a soul document (JSON), reference image URLs and an embedding.
- **World** belongs to a channel with a description, visual style and an embedding.
- **Reel** is one generation run. Its `pipelineState` keeps the script, image URLs and output paths.
- **AgentLog** records each node's input, output, status and duration.

## Real-time updates

Each pipeline node calls `emitAgentEvent()`. The SSE service keeps an in-memory list of subscribers per reel and pushes events to every open `/api/sse?reelId=` connection. Because subscribers live in process memory, run a single instance, or add a shared pub/sub if you scale out.

## Security boundaries

- Every API route except sign-in, registration and the WhatsApp webhook needs an active session. Writes need `EDITOR`, and user management needs `OWNER`.
- The WhatsApp webhook is off unless configured. It checks a secret in constant time and matches the owner number exactly, and it cannot run shell commands.
- Secrets only come from the environment. CI runs gitleaks over the full history on every push.
