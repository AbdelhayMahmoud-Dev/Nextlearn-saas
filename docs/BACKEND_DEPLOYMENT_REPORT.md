# NextLearn — Backend Deployment Report

Date: 2026-06-02
Engineer: Senior DevOps + Node.js Deployment

Decision based on the **actual** `server/` codebase, not assumptions.

---

## Phase 1 — Vercel Compatibility Audit

| Question | Answer | Evidence |
| --- | --- | --- |
| 1. Compatible with Vercel serverless? | **NO** | It's a persistent listening process, not stateless functions (see below). |
| 2. Does the repo contain `server/vercel.json`, `api/index.ts`, `api/*.ts`, serverless handlers? | **NO** | `ls server/vercel.json server/api` → not found. No `api/` directory exists. |
| 3. Deployable on Vercel WITHOUT modifications? | **NO** | No framework/handler for Vercel to detect → Vercel shows "Build Command = None, Output = N/A, Install = empty". |
| 4. Does Socket.io make Vercel unsuitable? | **YES** | `src/app.ts:70-71` `createServer(app); initSocket(httpServer)`, `src/config/socket.ts:12` `initSocket()`. WebSockets need a persistent connection + sticky sessions — Vercel serverless functions are short-lived and stateless. |
| 5. Does node-cron make Vercel unsuitable? | **YES** | `src/jobs/index.ts:44` `cron.schedule(...)`, registered at boot (`src/server.ts:12`). Cron needs a continuously running process; Vercel functions don't run between requests, so timers never fire. |
| 6. Does Redis usage make Vercel unsuitable? | **PARTIALLY** | `src/config/redis.ts:15` `new Redis(env.REDIS_URL, …)` opens a persistent TCP connection (ioredis). Serverless cold starts churn connections and exhaust the pool. (Not fatal alone — but combined with the above, confirms the architecture is process-oriented.) |

**Phase 1 result: NOT compatible with Vercel serverless.**

## Phase 2 — Repository Scan (exact paths)

| Component | File | Detail |
| --- | --- | --- |
| Express app factory | `server/src/app.ts` | `createApp()` builds the middleware stack + mounts `/api/v1`. |
| HTTP server creation | `server/src/app.ts:69-72` | `createHttpServer(app)` → `createServer(app)` (Node `http.Server`). |
| Socket.io initialization | `server/src/app.ts:71` → `server/src/config/socket.ts:12` | `initSocket(httpServer)` attaches a `socket.io` `Server`. |
| Server bootstrap / entrypoint | `server/src/server.ts` | `bootstrap()`: `connectDB()` → `getRedis()` → `registerJobs()` → `server.listen(env.PORT)` with SIGTERM/SIGINT graceful shutdown. |
| Cron jobs | `server/src/jobs/index.ts` | `registerJobs()` schedules 3 `cron.schedule` jobs (subscription expiry, weekly digest, plan expiry). |
| Redis initialization | `server/src/config/redis.ts` | `getRedis()` lazily creates an `ioredis` client when `REDIS_URL` is set. |
| MongoDB connection | `server/src/config/db.ts` | `connectDB()` pooled Mongoose connection. |
| Build output | `package.json` | `build: rimraf dist && tsc`, `start: node dist/server.js`, `main: dist/server.js`, `engines.node >= 20`. |

This is a **single long-running Node process** that owns the HTTP server, the
WebSocket server, the cron scheduler, and pooled DB/Redis connections.

## Phase 3 — Deployment Recommendation

**C) Should NOT be deployed on Vercel.**

Technical reasoning:
- **Execution model mismatch.** Vercel runs **stateless serverless functions**
  invoked per request and frozen/destroyed between invocations. NextLearn's
  backend `server.listen()`s and stays resident. Adapting it to a single catch-all
  function would still break the parts below.
- **Socket.io would not work.** Real-time features require a persistent WebSocket
  connection and (at scale) sticky routing. Serverless functions can't hold an
  open socket between invocations.
- **node-cron would never run.** Scheduled jobs depend on a process that stays
  alive. On Vercel the process doesn't exist between requests, so the timers never
  fire. (Vercel Cron is a different feature that pings an HTTP endpoint — it would
  require rewriting the jobs as authenticated endpoints.)
- **Persistent connections (Mongo pool, ioredis).** Per-invocation cold starts
  repeatedly open/close connections, causing pool exhaustion and latency.

Forcing this onto Vercel would mean deleting/replacing real-time + scheduling
features — i.e. shipping a degraded product. The backend belongs on a platform
that runs a persistent container/process.

### Recommended platforms (ranked)

| Rank | Platform | Why | Notes |
| --- | --- | --- | --- |
| **1** | **Railway** | Runs a persistent Node process; native WebSocket support on the generated domain; cron works because the process stays up; one-click managed MongoDB + Redis plugins; trivial env management; can build via Nixpacks or the existing `server/Dockerfile`. | Best balance of simplicity + capability for this stack. |
| **2** | **Render** | First-class "Web Service" for long-running Node; WebSockets supported; managed Redis; native Cron Jobs + background workers; Docker or native build. | Free tier spins down on idle (cold start + cron pauses) — use a paid instance for production. |
| **3** | **Fly.io** | Persistent VMs/containers, excellent WebSocket + global edge support, scales well. | More ops overhead (`fly.toml`, Docker-first, volumes) than Railway/Render. |

All three support persistent processes, WebSockets, cron, and Redis — the exact
things Vercel cannot. The repo already ships `server/Dockerfile` (multi-stage,
non-root, healthcheck) and root `docker-compose.yml`, so any of them deploys
cleanly.

> **Frontend stays on Vercel** (Root Directory `client`) — that part already works
> and is correct. Only the backend moves to Railway/Render/Fly.

## Phase 4 — Vercel serverless handlers

**Intentionally not created.** Since the verdict is C, generating
`server/vercel.json` + `api/*` handlers would produce a non-functional
deployment (no sockets, no cron) — i.e. a fake/broken integration. See
`RAILWAY_DEPLOYMENT_GUIDE.md` for the supported path.

## Final note

See `docs/RAILWAY_DEPLOYMENT_GUIDE.md` (step-by-step #1 recommendation) and
`docs/ENVIRONMENT_VARIABLES.md` (every backend env var).
