# NextLearn — Environment Variables

All backend configuration is read in **one place**: `server/src/config/env.ts`
(validated with Zod at boot — the process fails fast on misconfiguration). No
other backend file reads `process.env` directly. The table below is generated
from that schema.

Legend: **Required** = no default, boot fails if missing · **Optional** = feature
degrades gracefully if unset · **Default** = used when unset.

## Backend (`server/`)

| Variable | Required? | Description | Example |
| --- | --- | --- | --- |
| `NODE_ENV` | Default `development` | Runtime mode (`development`/`test`/`production`). | `production` |
| `PORT` | Default `5000` | HTTP port. On Railway/Render this is injected automatically. | `5000` |
| `MONGODB_URI` | **Required** | MongoDB connection string (Atlas or self-hosted). | `mongodb+srv://user:pass@cluster.mongodb.net/nextlearn` |
| `JWT_ACCESS_SECRET` | **Required** (min 32 chars) | Signs short-lived access tokens. | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | **Required** (min 32 chars, distinct) | Signs rotating refresh tokens. | `openssl rand -hex 32` |
| `JWT_ACCESS_EXPIRES_IN` | Default `15m` | Access token lifetime. | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Default `7d` | Refresh token lifetime. | `7d` |
| `CLIENT_URL` | Default `http://localhost:3000` | Public frontend URL (email links, redirects). | `https://app.yourdomain.com` |
| `ALLOWED_ORIGINS` | Default `http://localhost:3000` | Comma-separated CORS allowlist. | `https://app.yourdomain.com,https://www.yourdomain.com` |
| `RESEND_API_KEY` | Optional | Resend API key; if unset, emails are logged, not sent. | `re_...` |
| `EMAIL_FROM` | Default `NextLearn <noreply@nextlearn.com>` | From address for transactional email. | `NextLearn <noreply@yourdomain.com>` |
| `REDIS_URL` | Optional | ioredis connection; enables caching + durable rate limiting. Caching no-ops if unset. | `redis://default:pass@host:6379` |
| `STRIPE_SECRET_KEY` | Optional | Stripe secret; payment endpoints return 503 without it. | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Optional | Verifies Stripe webhook signatures. | `whsec_...` |
| `STRIPE_MONTHLY_PRICE_ID` | Optional | Price id for the monthly plan. | `price_...` |
| `STRIPE_ANNUAL_PRICE_ID` | Optional | Price id for the annual plan. | `price_...` |
| `STRIPE_SUCCESS_URL` | Default `http://localhost:3000/payment/success` | Checkout success redirect. | `https://app.yourdomain.com/payment/success` |
| `STRIPE_CANCEL_URL` | Default `http://localhost:3000/payment/cancel` | Checkout cancel redirect. | `https://app.yourdomain.com/payment/cancel` |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud name (media uploads). | `your-cloud` |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary API key. | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary API secret. | `abc...` |
| `AI_PROVIDER` | Default `local` | AI backend: `openai`, `anthropic`, or `local` (offline fallback). | `openai` |
| `OPENAI_API_KEY` | Optional | Used when `AI_PROVIDER=openai`; falls back to local if unset. | `sk-...` |
| `ANTHROPIC_API_KEY` | Optional | Used when `AI_PROVIDER=anthropic`; falls back to local if unset. | `sk-ant-...` |
| `OPENAI_MODEL` | Default `gpt-4o-mini` | OpenAI model id. | `gpt-4o-mini` |
| `ANTHROPIC_MODEL` | Default `claude-3-5-haiku-latest` | Anthropic model id. | `claude-3-5-haiku-latest` |
| `AI_MAX_OUTPUT_TOKENS` | Default `1024` | Max tokens per AI generation. | `1024` |
| `AI_TEMPERATURE` | Default `0.4` | Sampling temperature (0–2). | `0.4` |

**Minimum to boot in production:** `NODE_ENV`, `MONGODB_URI`,
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `ALLOWED_ORIGINS`.
Everything else enables an optional integration.

## Frontend (`client/`) — for completeness

These are set in the **Vercel** project (not the backend). The client reads only
`NEXT_PUBLIC_*` (browser-exposed) plus NextAuth's `AUTH_SECRET`.

| Variable | Required? | Description | Example |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | **Required** | Backend API base URL. | `https://api.yourdomain.com/api/v1` |
| `NEXT_PUBLIC_APP_URL` | **Required** | The frontend's own public URL. | `https://app.yourdomain.com` |
| `NEXT_PUBLIC_TENANT_ID` | **Required** | Default tenant id. | `665f...` |
| `AUTH_SECRET` | **Required** | NextAuth v5 secret. | `openssl rand -base64 32` |
| `NEXT_PUBLIC_SOCKET_URL` | Recommended | Backend Socket.io origin. | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Client-side Stripe key. | `pk_live_...` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Optional | Client-side media display. | `your-cloud` |

> Never commit real values. `server/.env` and `client/.env.local` are git-ignored;
> only `*.env.example` templates are tracked.
