# NextLearn — White-Label SaaS LMS

A production-grade, multi-tenant Learning Management System built with Next.js 14 + Express.js + MongoDB.

---

## Architecture

```
client/     Next.js 14 (App Router) — Vercel
server/     Express.js + TypeScript — Railway / Render
MongoDB     — database (Atlas in production)
Cloudinary  — media (video HLS + images)
Stripe      — payments + Connect payouts
Resend      — transactional email
Redis       — cache (optional, degrades gracefully)
Socket.io   — real-time notifications
```

## Quick Start (local)

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Redis (optional — caching degrades gracefully without it)

### 1. Clone & install
```bash
git clone <repo>
cd NextLearn

# Server
cd server && npm install
cp .env.example .env          # fill in values

# Client
cd ../client && npm install
cp .env.example .env.local    # fill in values
```

### 2. Seed the database
```bash
cd server
npm run seed:tenant    # default tenant + admin user
npm run seed:courses   # sample AI + Cybersecurity courses
```

### 3. Start dev servers
```bash
# Terminal 1 — server (port 5000)
cd server && npm run dev
# Terminal 2 — client (port 3000)
cd client && npm run dev
```
Open http://localhost:3000

---

## Docker (local full stack)
```bash
# MongoDB + Redis + Express server
docker-compose up -d
# Client runs outside Docker (hot reload)
cd client && npm run dev
```

---

## Environment Variables

### server/.env
| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_ACCESS_SECRET` | ✅ | JWT access token secret (32+ chars) |
| `JWT_REFRESH_SECRET` | ✅ | JWT refresh token secret (32+ chars) |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret (server only) |
| `RESEND_API_KEY` | ⚠️ | Resend email key (emails logged to console if absent) |
| `EMAIL_FROM` | ✅ | From address |
| `CLIENT_URL` | ✅ | Frontend URL |
| `ALLOWED_ORIGINS` | ✅ | CORS allowed origins (comma-separated) |
| `STRIPE_SECRET_KEY` | ⚠️ | Stripe secret key (payments return 503 if absent) |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ | Stripe webhook signing secret |
| `STRIPE_MONTHLY_PRICE_ID` / `STRIPE_ANNUAL_PRICE_ID` | ⚠️ | Subscription price IDs |
| `REDIS_URL` | ➖ | Redis URL (optional — cache disabled if absent) |

### client/.env.local
| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Express server URL + /api/v1 |
| `NEXT_PUBLIC_APP_URL` | ✅ | Next.js app URL |
| `NEXT_PUBLIC_TENANT_ID` | ✅ | Default tenant ObjectId |
| `AUTH_SECRET` | ✅ | NextAuth secret (32+ chars) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚠️ | Stripe publishable key |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | Socket.io server URL |

---

## Deployment

### Backend → Railway / Render
1. Connect the repo; set root directory to `server/`.
2. Build: `npm run build` · Start: `node dist/server.js`.
3. Add all server env vars; provision MongoDB Atlas + Redis (Upstash works well).

### Frontend → Vercel
1. Connect the repo; set root directory to `client/`; framework Next.js.
2. Add all client env vars (Vercel secrets); deploy. (`client/vercel.json` adds security headers.)

### Stripe Webhooks
Register `https://<server-host>/api/v1/webhooks/stripe` with events:
`checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`, `charge.refunded`.

---

## Real-time, Caching & Jobs (Phase 7)
- **Socket.io**: server emits to `user:{id}` (notifications) and `tenant:{id}` (live-session start) rooms; the client `SocketProvider` joins on login and invalidates queries on events.
- **Redis**: optional cache-aside (`withCache`/`invalidateCache`) on the public course catalog and admin KPIs; the app runs fine without Redis.
- **Cron jobs**: `subscriptionExpiry` (hourly), `planExpiry` (daily 00:00 UTC), `weeklyDigest` (Mon 09:00 UTC).

---

## Known Quirks
**OneDrive cache corruption (Windows):** `client/next.config.mjs` uses `config.cache = { type: 'memory' }` in dev so OneDrive can't intercept webpack chunk writes. If you see `ENOENT` on `.pack.gz`: `rm -rf client/.next && npm run dev`.

**Arabic locale (Windows):** all `toLocaleString()` calls pin `'en-US'` to avoid Arabic-Indic numerals.

**Authenticated areas build:** `(admin)/layout.tsx` and `(superadmin)/layout.tsx` set `export const dynamic = 'force-dynamic'` — static prerendering of authenticated, data-driven areas breaks `next build`.

---

## Phase Roadmap
| Phase | Status | Description |
|---|---|---|
| 1 | ✅ | Backend Foundation |
| 2 | ✅ | Student Experience |
| 3 | ✅ | Instructor Tools |
| 4 | ✅ | Payments (Stripe) |
| 5 | ✅ | Admin Panel |
| 6 | ✅ | White-Label SaaS Layer |
| 7 | ✅ | Production Polish |
