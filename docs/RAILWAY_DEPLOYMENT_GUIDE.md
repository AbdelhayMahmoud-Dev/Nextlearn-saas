# NextLearn — Railway Deployment Guide (Backend)

The backend (`server/`) is a long-running Express + Socket.io + node-cron process.
Railway is the recommended host (see `BACKEND_DEPLOYMENT_REPORT.md`). The frontend
stays on Vercel.

---

## 1. MongoDB Atlas setup

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and a project.
2. **Build a Cluster** (the free M0 tier is fine to start).
3. **Database Access** → add a database user (username + strong password). Save them.
4. **Network Access** → add IP `0.0.0.0/0` (Railway egress IPs are dynamic) — or
   Railway's static egress IPs if you enable them.
5. **Connect → Drivers** → copy the connection string:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/nextlearn?retryWrites=true&w=majority`
   - Append the database name (`/nextlearn`) before the `?`.
   - URL-encode special characters in the password.
6. This becomes the `MONGODB_URI` env var.

> Alternative: add Railway's **MongoDB plugin** instead of Atlas and use its
> provided `MONGO_URL` as `MONGODB_URI`. Atlas is recommended for production
> (backups, monitoring, scaling).

## 2. Environment variables required

Set these in Railway → your service → **Variables**. Full reference (with
optionals + examples) is in `docs/ENVIRONMENT_VARIABLES.md`.

**Required:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/nextlearn?retryWrites=true&w=majority
JWT_ACCESS_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<a different openssl rand -hex 32>
CLIENT_URL=https://<your-vercel-domain>
ALLOWED_ORIGINS=https://<your-vercel-domain>
```
`PORT` is provided by Railway automatically — the app reads `process.env.PORT`
(`config/env.ts` defaults to 5000 locally), so do not hardcode it.

**Recommended for production:**
```
REDIS_URL=redis://...            # add the Railway Redis plugin, use its URL
RESEND_API_KEY=...               # transactional email (else logged, not sent)
EMAIL_FROM=NextLearn <noreply@yourdomain.com>
STRIPE_SECRET_KEY=sk_live_...    # payments (endpoints 503 without it)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_ANNUAL_PRICE_ID=price_...
CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=...
AI_PROVIDER=openai               # or anthropic / local
OPENAI_API_KEY=sk-...            # or ANTHROPIC_API_KEY=sk-ant-...
```

## 3. Railway deployment steps

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** →
   select `AbdelhayMahmoud-Dev/Nextlearn-saas`.
2. **Settings → Root Directory:** `server` (deploys the backend independently of
   the frontend).
3. Build — choose one:
   - **Nixpacks (default):** Build `npm install && npm run build`; Start
     `npm run start` (`node dist/server.js`). Node 20+ is honored via
     `engines.node` in `server/package.json`.
   - **Dockerfile:** point Railway at `server/Dockerfile` (multi-stage, non-root,
     healthcheck on `/api/v1/health`). Recommended for reproducible builds.
4. Add the **Variables** from section 2.
5. (Optional) Add the **Redis** plugin → copy its connection string into `REDIS_URL`.
6. Deploy. Confirm health: `https://<railway-domain>/api/v1/health` → `200`.

## 4. Domain setup

1. Railway generates `https://<service>.up.railway.app` automatically.
2. For a custom API domain (e.g. `api.yourdomain.com`): Railway → service →
   **Settings → Networking → Custom Domain** → add it → create the shown CNAME at
   your DNS provider → wait for TLS to provision.
3. Use this domain as the backend base URL on the frontend.

## 5. Frontend integration (Vercel)

In the Vercel project (Root Directory `client`), set:
```
NEXT_PUBLIC_API_URL=https://<railway-domain>/api/v1
NEXT_PUBLIC_SOCKET_URL=https://<railway-domain>
NEXT_PUBLIC_APP_URL=https://<your-vercel-domain>
NEXT_PUBLIC_TENANT_ID=<default tenant id>
AUTH_SECRET=<openssl rand -base64 32>
```
On the backend, set `CLIENT_URL` and include the Vercel domain in
`ALLOWED_ORIGINS` (comma-separated for multiple). CORS is driven by
`ALLOWED_ORIGINS` (`config/env.ts` → `allowedOrigins`). Redeploy the frontend.

## 6. Socket.io compatibility

- Railway supports WebSockets on the generated/custom domain out of the box — no
  extra config for a **single instance**.
- The client connects to `NEXT_PUBLIC_SOCKET_URL`; rooms are `user:{id}` /
  `tenant:{id}` (`config/socket.ts`).
- **Scaling caveat (honest):** socket state is in-process. If you scale the
  backend to **more than one replica**, add the Socket.io Redis adapter
  (`@socket.io/redis-adapter`) so events fan out across instances, and enable
  sticky sessions. For a single replica (typical to start), no change is needed.

## 7. Production checklist

- [ ] `MONGODB_URI` points to Atlas; Network Access allows Railway.
- [ ] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are distinct 32+ char secrets.
- [ ] `NODE_ENV=production`.
- [ ] `CLIENT_URL` + `ALLOWED_ORIGINS` contain the exact Vercel domain (https).
- [ ] `GET /api/v1/health` returns 200 on the Railway domain.
- [ ] Frontend `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SOCKET_URL` point at the backend.
- [ ] Stripe: live keys set **and** the webhook points to
      `https://<railway-domain>/api/v1/webhooks/stripe` with `STRIPE_WEBHOOK_SECRET`.
- [ ] Redis plugin added + `REDIS_URL` set (caching + rate-limit durability).
- [ ] Email provider (`RESEND_API_KEY`) set so verification/reset emails send.
- [ ] Run the seed once if needed: `npm run seed:tenant` (Railway shell) to create the first tenant + admin.
- [ ] Single replica, or Redis Socket.io adapter + sticky sessions if scaling out.
- [ ] Custom domain + TLS provisioned (if used).
