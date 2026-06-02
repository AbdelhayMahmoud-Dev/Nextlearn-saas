# NextLearn — Deployment Guide

Two deployables: the **API** (`server/`) and the **client** (`client/`).

## Prerequisites

- Node.js ≥ 20 (developed on 24)
- MongoDB 6+ (Atlas or self-hosted)
- Redis (optional but recommended in production)
- Accounts/keys (all optional — features degrade gracefully without them):
  Stripe, Resend, Cloudinary, OpenAI **or** Anthropic.

## Environment variables

### Server (`server/.env`) — see `server/.env.example`

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Yes | ≥ 32 chars each |
| `CLIENT_URL` | Yes | Public client origin (email links, redirects) |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS allowlist |
| `REDIS_URL` | No | Enables caching when set |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | No | Payments; endpoints return 503 if unset |
| `RESEND_API_KEY` / `EMAIL_FROM` | No | Email; logs to console in dev if unset |
| `CLOUDINARY_*` | No | Media uploads |
| `AI_PROVIDER` | No | `local` (default), `openai`, or `anthropic` |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | No | Falls back to local provider if missing |

### Client (`client/.env.local`) — see `client/.env.example`

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | e.g. `https://api.example.com/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Public client URL (sitemap, referral links) |
| `NEXT_PUBLIC_TENANT_ID` | Default tenant for local/dev |
| `AUTH_SECRET` | NextAuth session secret |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io origin |

## Local development

```bash
# Server
cd server
cp .env.example .env        # fill in MONGODB_URI + JWT secrets
npm install
npm run seed:tenant         # creates a demo tenant + admin
npm run seed:courses        # demo catalog
npm run dev                 # tsx watch on :5000

# Client
cd client
cp .env.example .env.local  # set NEXT_PUBLIC_TENANT_ID to the seeded id
npm install
npm run dev                 # Next.js on :3000
```

## Production build

```bash
# Server  → compiles to dist/, run with node
cd server && npm run build && npm start

# Client  → Next.js production build
cd client && npm run build && npm start
```

## Docker

`docker-compose.yml` (repo root) runs `mongo`, `redis`, and the API with
healthchecks and `depends_on: service_healthy`. `server/Dockerfile` is a
multi-stage build running as a non-root user with a healthcheck on
`GET /api/v1/health`.

```bash
docker compose up --build
```

The client is intended for a platform like Vercel (`client/vercel.json` defines
framework + security headers); it can also be containerized separately.

## Stripe webhooks

Point a Stripe webhook at `POST /api/v1/payments/webhook` (raw body is mounted
before `express.json()` and the signature is verified). Set
`STRIPE_WEBHOOK_SECRET`. Operational status of the webhook config is visible at
`/superadmin/ops`.

## Custom domains (white-label)

1. Tenant admin adds a domain under **Admin → White-Label**; the API issues a
   TXT verification token.
2. Admin publishes a TXT record at `_nextlearn.<domain>` with that value.
3. Admin clicks **Verify**; the API performs a real `dns.resolveTxt` lookup and,
   on success, wires the domain into tenant resolution.
4. Point the domain's A/CNAME at the client deployment and add it to the
   client's allowed hosts / TLS configuration.

## Post-deploy checks

- `GET /api/v1/health` returns 200.
- `/superadmin/ops` shows database/redis/email/stripe/AI component health and
  scheduled-job status.
- Run `npm run docs:api` after route changes to regenerate `docs/API.md`.

## Operational notes

- **Index sync:** Mongoose builds indexes on connect in dev. For production,
  build indexes during a maintenance window or via a migration step.
- **OneDrive dev quirk:** building the client inside a OneDrive-synced folder can
  emit a transient `PageNotFoundError`; a rebuild passes. Not a production concern.
