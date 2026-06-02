# NextLearn — Architecture

A multi-tenant, white-label SaaS Learning Management System. Two deployables: a
TypeScript **Express API** (`server/`) and a **Next.js 14 App Router** client
(`client/`), backed by **MongoDB** (Mongoose) with optional **Redis** caching.

## High-level diagram

```
                ┌────────────────────────────┐
   Browser ───▶ │  Next.js 14 (client/)      │
                │  - App Router, RSC + CSR    │
                │  - NextAuth (session shell) │
                │  - TanStack Query + axios   │
                └─────────────┬──────────────┘
                              │ HTTPS  Authorization: Bearer <accessToken>
                              │        x-tenant-id (public) / subdomain / custom domain
                ┌─────────────▼──────────────┐
                │  Express API (server/)      │
                │  routes → controllers →     │
                │  services → models          │
                │  middleware: authenticate,  │
                │  tenantResolver, requireRole│
                └───┬─────────────┬───────────┘
                    │             │
            ┌───────▼──┐    ┌─────▼──────┐    ┌───────────────┐
            │ MongoDB  │    │  Redis     │    │ External APIs │
            │ (Mongoose)    │ (cache,    │    │ Stripe, Resend│
            └──────────┘    │  optional) │    │ OpenAI/Anthropic
                            └────────────┘    │ (optional)    │
                                              └───────────────┘
```

## Multi-tenancy

Every domain document carries a `tenantId`. Tenant context is resolved two ways:

- **Authenticated requests:** the access JWT embeds `tenantId`; it is authoritative.
  A conflicting `x-tenant-id` header is rejected with 403 (checked in
  `authenticate`, independent of middleware order).
- **Public requests:** `tenantResolver` resolves the tenant from the
  `x-tenant-id` header, subdomain, or a verified custom domain, attaching
  `req.tenant`. `requireTenant` enforces presence.

Suspended tenants return 503 for everyone; maintenance mode returns 503 only for
authenticated learners (so admins can still sign in and disable it).

## Request lifecycle (layered)

```
routes/v1/*.routes.ts      Express routers; attach middleware + validation
   └─ middleware            authenticate · tenantResolver · requireRole · validate(zod) · rateLimiter
   └─ controllers/*         thin: read req via getAuthUser/getTenantId/getRequestContext, call a service, ApiResponse
        └─ services/*       all business logic; own DB access; .lean() reads; $aggregate analytics
             └─ models/*    Mongoose schemas (the database layer)
```

Cross-cutting helpers: `ApiResponse` (success envelope), `ApiError` +
`errorHandler` (error envelope), `asyncHandler` (promise error forwarding),
`pagination` (`getPagination`/`buildPaginationMeta`), `logger` (pino).

## Authentication & sessions

- Access JWT (15 min) + rotating refresh token (7 d) delivered as an httpOnly
  cookie scoped to `/api/v1/auth`. Refresh tokens are stored as SHA-256 hashes
  in `User.refreshTokens` (capped to 5 active sessions).
- **Device sessions** (`Session` model) mirror each refresh-token hash, enabling
  the session-management UI and per-device revocation.
- **Refresh-token reuse detection:** presenting an unrecognized (already-rotated)
  token wipes the entire token family and records a `token_reuse` security event.
- **Security trail** (`SecurityEvent`) + **audit log** (`AuditLog`) are
  append-only and written best-effort so they never break the primary flow.

## Phase 8 enterprise subsystems

| Subsystem | Key models | Entry points |
| --- | --- | --- |
| AI assistant | `AIConversation` | `services/ai/*` provider abstraction (OpenAI/Anthropic/local), `/api/v1/ai/*` |
| Advanced analytics | (reads existing) | `admin.advancedAnalytics.service`, `/admin/analytics/*` |
| Marketplace | (reads Course/User) | `marketplace.service`, public `/marketplace/*` |
| Affiliates | `Affiliate`, `AffiliateReferral`, `AffiliateCommission`, `AffiliatePayout` | `/affiliate/*`, `/admin/affiliates/*` |
| Advanced white-label | `WhiteLabel` (extended), `EmailTemplate` | `whiteLabel.service`, `/admin/white-label/*` |
| Enterprise security | `Session`, `SecurityEvent`, `AuditLog` | `/auth/sessions*`, `/admin/security/*` |
| Operations | (in-memory job registry) | `ops.service`, `/superadmin/ops` |

## AI provider abstraction

`services/ai/ai.provider.ts` selects a provider from `AI_PROVIDER`. OpenAI and
Anthropic providers call their REST APIs (no SDK dependency). When the selected
hosted provider has no API key, the service transparently falls back to a
dependency-free **local provider** (extractive summarization + keyword-overlap
QA), so AI features always function. Tutor chats are grounded in course/lesson
content and persisted as `AIConversation` threads.

## Caching & background work

- `config/redis.ts` exposes `withCache`/`invalidateCache`, degrading to a
  no-op when `REDIS_URL` is unset. Applied to the public catalog, admin KPIs,
  and advanced-analytics aggregations.
- `jobs/` registers node-cron jobs (subscription expiry, weekly digest, plan
  expiry). Each run is wrapped by `jobs/jobRegistry` to record timing and
  success/failure for the operational dashboard.

## Client architecture

- App Router route groups: `(main)` public/student, `(instructor)`, `(admin)`,
  `(superadmin)`. Authenticated, data-driven group layouts set
  `export const dynamic = 'force-dynamic'`.
- Data fetching via TanStack Query hooks (`hooks/use*.ts`) over a shared axios
  `apiClient` that injects the bearer token + tenant header and performs a
  single-flight refresh on 401.
- Branding is applied at runtime from `/tenant/config` (CSS variables), enabling
  per-tenant theming and feature-flag gating.
