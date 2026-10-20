# API

All routes live under `/api` and return JSON. Unless noted, they need a signed-in, approved user. Roles rank `VIEWER`, then `EDITOR`, then `OWNER`.

## Generation

| Method | Route                  | Role   | Purpose                                                                                                               |
| ------ | ---------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/agents/generate` | editor | Start a reel. Body: `channelId`, `prompt`, optional `language`, `style`, `duration`, `quality`. Returns `{ reelId }`. |
| GET    | `/api/sse?reelId=`     | viewer | Server-Sent Events stream of agent events for one reel.                                                               |
| GET    | `/api/agents/logs`     | viewer | Recent agent log rows.                                                                                                |

## Reels

| Method | Route            | Role   | Purpose                                                      |
| ------ | ---------------- | ------ | ------------------------------------------------------------ |
| GET    | `/api/reels`     | viewer | List reels. Query: `channelId`, `status`, `limit`, `offset`. |
| GET    | `/api/reels/:id` | viewer | One reel with its pipeline state.                            |

## Channels, characters and worlds

| Method             | Route                             | Role           | Purpose                           |
| ------------------ | --------------------------------- | -------------- | --------------------------------- |
| GET, POST          | `/api/channels`                   | viewer, editor | List or create channels.          |
| GET, PATCH, DELETE | `/api/channels/:id`               | viewer, editor | Read, update or delete a channel. |
| GET, POST          | `/api/channels/:id/characters`    | viewer, editor | List or add characters.           |
| PATCH              | `/api/characters/:id`             | editor         | Update reference images.          |
| PATCH              | `/api/worlds/:id`                 | editor         | Update reference images.          |
| GET                | `/api/characters/similar?prompt=` | viewer         | Nearest characters by embedding.  |
| GET                | `/api/worlds/similar?prompt=`     | viewer         | Nearest worlds by embedding.      |

## Accounts

| Method        | Route                       | Role      | Purpose                                 |
| ------------- | --------------------------- | --------- | --------------------------------------- |
| POST          | `/api/auth/register`        | public    | Create a pending account.               |
| POST          | `/api/auth/change-password` | signed in | Change your password.                   |
| GET           | `/api/admin/users`          | owner     | List users.                             |
| PATCH, DELETE | `/api/admin/users/:id`      | owner     | Approve, reject, change role or remove. |

## WhatsApp webhook

`POST /api/whatsapp` takes `{ "message": "...", "from": "+1..." }` with the `x-kalki-secret` header and answers `{ "reply": "..." }`.

Commands: `generate reel about <topic> [for <channel>]`, `status`, `channels`, `reels` and `help`. It returns 503 until both `KALKI_WEBHOOK_SECRET` and `WHATSAPP_OWNER_NUMBER` are set, 401 on a wrong secret, and "Access denied." for any other sender.
