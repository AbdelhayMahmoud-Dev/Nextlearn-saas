# NextLearn — Phase 1 Architecture Audit

**Scope:** Server backend (`server/`) — foundation, middleware stack, auth module, and all 19 Mongoose models.
**Date:** 2026-05-30
**Verdict:** ✅ **PASS** — all blocking issues fixed and re-verified. Safe to scale.

> **Cross-tenant isolation — conclusive re-verification (2026-05-30, clean environment):**
> Asserted port 5000 free *before* start → fresh server **PID 7600 (StartTime 11:32:11)** → full auth smoke test: Register 201 · Login 200 · Me 200 · Refresh 200 · **wrong-tenant `/me` → 403** ("Access token does not belong to the requested tenant", thrown at `authenticate.ts:27`). The earlier inconclusive `200` was confirmed to be a stale-process (`EADDRINUSE`) artifact, not a code defect.

---

## 1. Verification gates

| Gate | Command | Result |
|---|---|---|
| Dependency install | `npm install` | ✅ 205 pkgs, 0 vulnerabilities |
| Strict typecheck | `tsc --noEmit` | ✅ exit 0 |
| Production build | `npm run build` | ✅ exit 0, 40 JS files emitted |
| Circular dependencies | `madge --circular` | ✅ none found |
| Forbidden types (`any`/`as any`/`as unknown`/`@ts-ignore`) | grep | ✅ 0 matches |
| `console.*` in code | grep | ✅ only 2, both justified¹ |
| Model registration + index build | `npm run verify:models` | ✅ 19 models, 21 indexes, no warnings |
| Auth flow + security smoke test | live curl suite | ✅ all expected status codes |

¹ `env.ts` (must run before the logger, which depends on env) and `scripts/seedTenant.ts` (CLI stdout). Both intentional.

---

## 2. What is implemented

- **Config:** zod-validated, fail-fast, frozen env loader; pooled Mongo singleton (idempotent connect, graceful close); optional Redis client (no-ops without `REDIS_URL`).
- **Utilities:** `ApiError` (operational, with factories), `ApiResponse` (canonical success envelope), `asyncHandler`, `pino` logger (secret redaction), pagination, duration parser, centralized `formatZodError`, typed request-context accessors.
- **Middleware stack:** helmet · whitelist CORS · NoSQL-sanitize · hpp · custom XSS · `authenticate` (JWT) · `requireRole` · `tenantResolver` · `requireTenant` · `validate` (zod) · `requestLogger` (pino-http, request-id) · centralized `errorHandler` + `notFound` · global & auth rate limiters.
- **Auth module (end-to-end):** register → email verify → login → JWT access (15m) + rotating refresh (7d, httpOnly cookie) with reuse-detection → refresh → logout → forgot/reset password. bcrypt rounds = 12.
- **Data layer:** all 19 models (`Tenant … WhiteLabel`), each tenant-scoped with indexes and full TS interfaces.
- **Multi-tenancy:** `tenantId` on every model; per-request tenant resolution from `x-tenant-id`/`x-tenant-slug`/subdomain; token-authoritative tenant on authenticated requests.

---

## 3. Findings & resolutions

Severity: 🔴 High · 🟡 Medium · ⚪ Low.

### 🔴 HIGH-1 — Input sanitizers ran before body parsing (no-op) — **FIXED**
`applySecurity()` registered `express-mongo-sanitize`, `hpp`, and the XSS sanitizer **before** `express.json()`, so `req.body` was `undefined` when they ran — body-level NoSQL/XSS sanitization silently did nothing.
**Fix:** split into `applyEarlySecurity` (helmet+CORS, pre-parse) and `applyInputSanitizers` (post-parse) and reordered `app.ts`.
**Verified:** NoSQL-injection login payload `{"email":{"$gt":""}}` → **HTTP 400** (was a latent bypass).

### 🔴 HIGH-2 — Cross-tenant token replay not blocked — **FIXED**
`authenticate` trusted the token but never reconciled it with a tenant supplied by header/subdomain, and the check only worked if `tenantResolver` happened to run first.
**Fix:** `authenticate` now treats the signed token as authoritative and rejects any conflicting resolved **or raw `x-tenant-id`** tenant (order-independent); `tenantResolver` defers to an already-authenticated tenant.
**Verified:** `/me` with a valid token but mismatched `x-tenant-id` → **HTTP 403**; matching/absent → 200.

### 🔴 HIGH-3 — Internal error messages leaked in production — **FIXED**
The error handler's fallback set `message = err.message` for any `Error`, so unexpected 500s would return raw internal messages to clients in production.
**Fix:** track `isOperational`; non-operational failures return a generic message in prod (full detail still logged, and shown in dev).

### 🟡 MED-1 — Validation errors keyed by wrapper, not field — **FIXED**
Errors came back as `{ "body": [...] }` instead of per-field. Centralized `formatZodError` strips the `body/query/params` segment.
**Verified:** weak-password register → `{ "name": [...], "password": [...] }`.

### 🟡 MED-2 — Missing indexes on token-lookup fields — **FIXED**
`verificationToken` / `passwordResetToken` were queried but unindexed (collection scans). Added sparse indexes.

### 🟡 MED-3 — JWT duration env vars not format-validated — **FIXED**
`JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` now validated against a duration regex at boot (fail-fast instead of a runtime throw later).

### 🟡 MED-4 — Tenant-requirement logic would be duplicated across controllers — **FIXED**
Extracted a `requireTenant` middleware + `getTenantId`/`getAuthUser` typed accessors; applied to auth routes; removed the controller-local helper before it spread to 17 future controllers.

### ⚪ LOW-1 — Duplicate attachment subschema — **FIXED**
`Lesson` and `Submission` defined identical attachment schemas. Extracted `models/common.ts` (`IAttachment` + `attachmentSchema`); both now import it.

### ⚪ LOW-2 — `PublicUser.role` typed as `string` — **FIXED**
Narrowed to `UserRole`.

---

## 4. Accepted trade-offs & technical debt (tracked, not blocking)

| # | Item | Decision / Recommendation |
|---|---|---|
| T1 | Stateless access token isn't revocable within its 15-min window (deleted/deactivated/role-changed user) | Accepted (standard JWT trade-off). Future: token-version claim or DB re-check on sensitive operations. |
| T2 | Registration reveals whether an email exists (409) | Accepted UX trade-off. Can move to a generic "check your email" flow if enumeration becomes a concern. |
| T3 | Login permitted for unverified users | Intentional. Recommend gating sensitive actions on `isVerified` rather than blocking login. |
| T4 | Rate-limit store is in-memory (per-instance) | Tech debt → Redis store in **Phase 7** for multi-instance correctness. |
| T5 | CSRF | Mitigated by design: API authorization is Bearer-token only (no ambient cookie auth); the sole cookie (refresh) is httpOnly + `sameSite` + path-scoped to `/api/v1/auth`. No CSRF tokens required. |
| T6 | Access/refresh tokens lack `iss`/`aud` claims | Optional hardening; add if deploying across multiple audiences. |
| T7 | `autoIndex` disabled in production | Add an explicit index-sync step (`ensureIndexes`) to the deploy pipeline. |
| T8 | Blanket XSS sanitizer strips all HTML from body strings | Will conflict with Tiptap rich-text lessons — use a per-route allow-list sanitizer for rich-text endpoints in **Phase 3**. |
| T9 | Decoded JWT payloads are cast, not runtime-validated | Low risk (self-signed). Optional: zod-validate the decoded claims. |
| T10 | A few redundant single-field `tenantId` indexes where a `tenantId`-prefixed compound exists | Left in place (serve non-prefixed queries); revisit during query profiling. |

---

## 5. Dimension scorecard

| Dimension | Status |
|---|---|
| TypeScript strict compliance | ✅ clean (no `any`/ignores) |
| No circular dependencies | ✅ madge clean |
| No duplicate business logic | ✅ (attachment schema + tenant guard de-duplicated) |
| Auth flow consistency | ✅ verified end-to-end |
| Refresh token rotation security | ✅ rotation + hashed-at-rest + reuse-revocation |
| Multi-tenant isolation | ✅ token-authoritative, cross-tenant replay blocked (verified 403) |
| MongoDB index strategy | ✅ token-field indexes added; compound uniqueness correct |
| Environment variable validation | ✅ fail-fast incl. duration formats |
| Error handling consistency | ✅ centralized; no prod info leak |
| API response consistency | ✅ canonical envelope across success & error |

**Conclusion:** Phase 1 is structurally sound and the codebase is safe to scale. Proceed to the remaining foundation (Next.js client scaffold).
