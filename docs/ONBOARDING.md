# NextLearn — Developer Onboarding

Welcome. This gets you productive in the codebase quickly.

## 1. Get it running

Follow **DEPLOYMENT.md → Local development**. You need MongoDB running locally
(or an Atlas URI) and two terminals (server on :5000, client on :3000). Redis,
Stripe, Resend, Cloudinary, and AI keys are all optional — the app boots and
degrades gracefully without them.

## 2. Repository map

```
server/
  src/
    config/        env (zod-validated), db, redis, socket, stripe
    middleware/    authenticate, tenantResolver, requireRole, validate, rateLimiter
    models/        Mongoose schemas (the database layer)
    services/      business logic (one per domain; ai/ has the provider layer)
    controllers/   thin HTTP handlers
    routes/v1/     routers; index.ts assembles + mounts them
    validations/   zod schemas (wrap { body, query, params })
    jobs/          node-cron jobs + jobRegistry (ops tracking)
    scripts/       seeds + generateDocs (npm run docs:api)
    utils/         ApiResponse, ApiError, asyncHandler, pagination, logger, requestContext
client/
  app/             App Router; route groups (main)/(instructor)/(admin)/(superadmin)
  components/      UI; grouped by area (admin/, marketplace/, profile/, common/, ui/)
  hooks/           TanStack Query data hooks (use*.ts)
  lib/             api-client (axios), utils, referral, security-format, logger
  providers/       TenantThemeProvider, SocketProvider, query provider
docs/              this folder
```

## 3. Conventions (please follow)

**TypeScript / quality**
- No `any`, `@ts-ignore`, or `as unknown`. Strict mode is on; both packages must
  pass `tsc --noEmit` with zero errors.
- No `console.*` in feature code — use `logger` (server) or `clientLogger`
  (client). Numbers shown to users use `toLocaleString('en-US')`.

**Server**
- Controllers stay thin; logic lives in services. Read the request via
  `getAuthUser(req)`, `getTenantId(req)`, `getRequestContext(req)`.
- Always scope queries by `tenantId`. Use `.lean()` for reads; `$aggregate` for
  analytics. Never return `password` / `refreshTokens`.
- Validate input with `validate(zodSchema)`. Responses go through
  `ApiResponse.success(res, data, msg, status?, meta?)`; throw `ApiError.*`.
- Side-effect logging (security/audit/affiliate) is best-effort — wrap in
  try/catch and never let it break the primary flow.

**Client**
- Authenticated, data-driven group layouts set `export const dynamic = 'force-dynamic'`.
- Use the shared `apiClient`; never read tokens manually. New server data → a
  typed hook in `hooks/`.

## 4. Add a feature (server) — worked example

1. **Model** (`models/Thing.model.ts`) — schema with `tenantId` + indexes; export
   from the barrel if it needs `ref` population.
2. **Service** (`services/thing.service.ts`) — all logic; tenant-scoped queries.
3. **Validation** (`validations/thing.validation.ts`) — zod `{ body/query/params }`.
4. **Controller** (`controllers/thing.controller.ts`) — thin handlers.
5. **Routes** (`routes/v1/thing.routes.ts`) — attach `authenticate` /
   `requireRole` / `validate`; register the router in `routes/v1/index.ts`.
6. Run `npm run typecheck`, then `npm run docs:api` to refresh the API reference.

## 5. Add a feature (client)

1. Add a typed hook in `hooks/useThing.ts` (TanStack Query over `apiClient`).
2. Build the page under the right route group; reuse `components/ui/*` and
   common components. Gate by feature flag via `/tenant/config` when relevant.
3. `npm run typecheck` then `npm run build`.

## 6. Verification gates (run before every commit)

```bash
# server
cd server && npm run typecheck && npm run build
# client
cd client && npm run typecheck && npm run build
```

Both must be clean. There is no test runner wired yet (see the Phase 8 audit's
technical-debt section) — typecheck + build + manual smoke are the gates today.

## 7. Where things live (quick answers)

- **Auth & sessions:** `services/auth.service.ts`, `services/session.service.ts`,
  `controllers/auth.controller.ts`, `/auth/sessions*`.
- **Payments:** `services/payment.service.ts`, `controllers/webhook.controller.ts`.
- **Multi-tenant resolution:** `middleware/tenantResolver.ts`,
  `services/tenant.service.ts`, public `GET /tenant/config`.
- **AI:** `services/ai/` (provider abstraction), `services/ai.service.ts`.
- **Ops health:** `services/ops.service.ts`, `/superadmin/ops`.
- **Full endpoint list:** `docs/API.md` (regenerate with `npm run docs:api`).
