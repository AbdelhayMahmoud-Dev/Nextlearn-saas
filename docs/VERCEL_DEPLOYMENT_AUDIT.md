# NextLearn — Vercel Deployment Audit

Date: 2026-06-02
Auditor: Senior DevOps + Vercel Deployment Engineer

---

## Root Cause

`client/vercel.json` declared an `env` block that mapped every variable to a
**legacy Vercel Secret reference** using the `@secret-name` syntax:

```json
"env": {
  "NEXT_PUBLIC_API_URL": "@next-public-api-url",
  "NEXT_PUBLIC_APP_URL": "@next-public-app-url",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "@next-public-stripe-pk",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME": "@next-public-cloudinary-name",
  "NEXT_PUBLIC_SOCKET_URL": "@next-public-socket-url",
  "NEXT_PUBLIC_TENANT_ID": "@next-public-tenant-id",
  "AUTH_SECRET": "@auth-secret"
}
```

The `@name` form requires a **Vercel Secret** (the deprecated `vercel secrets add`
store) to pre-exist with that exact name. None were created, so the build failed
with:

> Environment Variable 'NEXT_PUBLIC_API_URL' references Secret 'next-public-api-url', which does not exist.

This is the only source of the error. Vercel deprecated the `@secret` mapping
pattern in favor of standard project **Environment Variables**.

## Fix Applied

Removed the entire `env` secret-mapping block from `client/vercel.json`. Env vars
are now provided as standard Vercel Environment Variables (dashboard or
`vercel env`), which is the supported model. The valid parts of the config
(`framework`, build/install commands, security `headers`) were preserved.

Resulting `client/vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "headers": [ { "source": "/(.*)", "headers": [ /* security headers */ ] } ]
}
```

## Files Modified

| File | Change |
| --- | --- |
| `client/vercel.json` | Removed the `env` block of `@secret` references (7 entries). Kept framework + build settings + security headers. |
| `docs/VERCEL_DEPLOYMENT_AUDIT.md` | This report. |

No other `@secret` references exist anywhere in the repository (verified). There
is no `server/vercel.json` and no `.vercel` directory.

## Security Audit Result

| Check | Result |
| --- | --- |
| `.env*` / `*.pem/key/crt/p12` tracked by git | **None** (only `*.env.example` templates) |
| Live secrets in tracked files (Stripe, AWS, OpenAI, Anthropic, Google `GOCSPX-`, Mongo URI w/ creds, PEM keys) | **None** |
| `.gitignore` covers env files + keys | **Yes** (`client/.env.local`, `server/.env`, `*.pem` all ignored) |
| Sensitive files needing history removal | **None** |

No hardcoded secrets were ever committed; nothing required `git rm --cached` or
history surgery.

## Required Vercel Environment Variables (Frontend — project root `client/`)

| Variable | Required | Example / Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | **Yes** | `https://<your-backend-host>/api/v1` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | `https://<your-vercel-domain>` (sitemap, referral links) |
| `NEXT_PUBLIC_TENANT_ID` | **Yes** | default tenant ObjectId |
| `AUTH_SECRET` | **Yes** | NextAuth v5 secret — `openssl rand -base64 32` |
| `NEXT_PUBLIC_SOCKET_URL` | Recommended | backend Socket.io origin (e.g. `https://<your-backend-host>`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | only if client-side Stripe UI is used |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Optional | client-side media display |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth is deferred (button disabled) |

NextAuth v5 auto-detects the deployment URL on Vercel, so `AUTH_URL` /
`NEXTAUTH_URL` are not required. (Set `AUTH_URL` only for non-Vercel hosts.)

## Frontend Deployment Instructions (Vercel)

1. **New Project** → import the GitHub repo `AbdelhayMahmoud-Dev/Nextlearn-saas`.
2. **Root Directory:** `client` (this makes the frontend deploy independently of
   the backend; the framework preset auto-detects Next.js).
3. **Environment Variables:** add the variables in the table above (Production +
   Preview). Do **not** use `@secret` references.
4. Deploy. Build command `npm run build`, output `.next` (already in `vercel.json`).

## Backend Deployment Instructions (independent, from `server/`)

The backend is a **long-running Express server with Socket.io + node-cron jobs**,
which is not a fit for Vercel's serverless functions (no persistent sockets/cron).
Deploy it on a container/long-process host — the repo already ships
`server/Dockerfile` (multi-stage, non-root, healthcheck) and a root
`docker-compose.yml` (mongo + redis + server).

1. **Host:** Render / Railway / Fly.io / any Docker host. Root Directory: `server`.
2. **Build:** `npm install && npm run build`; **Start:** `npm start`
   (`node dist/server.js`). Or use `server/Dockerfile`.
3. **Required env:** `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
   `CLIENT_URL` (the Vercel URL), `ALLOWED_ORIGINS` (include the Vercel domain).
   Optional: `REDIS_URL`, `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`,
   `RESEND_API_KEY`, `CLOUDINARY_*`, `AI_PROVIDER` + `OPENAI_API_KEY` /
   `ANTHROPIC_API_KEY`. (All optional integrations degrade gracefully.)
4. Point the frontend's `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SOCKET_URL` at this
   host, and add the Vercel domain to `ALLOWED_ORIGINS`.

## Build Verification

| Gate | Result |
| --- | --- |
| Server `npm run typecheck` | ✅ 0 errors |
| Server `npm run build` | ✅ clean |
| Client `npm run type-check` | ✅ 0 errors |
| Client `npm run build` | ✅ Compiled successfully |

(The `fetch failed` lines during the client build are the sitemap's best-effort
course fetch with no live API at build time — handled gracefully; the build still
succeeds and degrades to static routes.)

## Deployment Readiness

- **Frontend deployment ready: YES** — root `client/`, standard env vars, no
  secret references remain.
- **Backend deployment ready: YES** — via Docker/Render/Railway from `server/`
  (not Vercel serverless, by design).
