# NextLearn — Project Overview

A complete walkthrough of the platform: what it does, how it's built, how to run
it, and what was audited/fixed in this session. For deeper references see
`ARCHITECTURE.md`, `DEPLOYMENT.md`, `ONBOARDING.md`, and `API.md`.

---

## 1. What the product does

NextLearn is a **multi-tenant, white-label SaaS Learning Management System**. A
single deployment serves many independent "tenants" (organizations), each with
its own branding, domain, users, courses, payments, and analytics. It supports:

- **Students:** browse a catalog/marketplace, enroll (free or paid), learn via a
  video/article player with progress tracking, take quizzes, submit assignments,
  earn certificates, and use an AI learning assistant.
- **Instructors:** author courses (modules/lessons/quizzes/assignments), run live
  sessions, grade work, and see real revenue + student analytics.
- **Tenant admins:** manage users, courses, payments, coupons, branding,
  white-label settings (theme/domain/feature flags/email templates), advanced
  analytics, an affiliate program, and a security console.
- **Super admins:** manage tenants cross-tenant, see global analytics, and monitor
  operational health.

## 2. Architecture & request flow

Two deployables: **`server/`** (Express 4 + TypeScript strict + MongoDB/Mongoose)
and **`client/`** (Next.js 14 App Router + TanStack Query + axios). Optional
Redis for caching.

```
Browser ─▶ Next.js client ─▶ Express API ─▶ MongoDB
                              │  routes → controllers → services → models
                              │  middleware: authenticate · tenantResolver ·
                              │              requireRole · validate(zod) · rateLimiter
                              └─▶ Redis (cache) · Stripe · Resend · OpenAI/Anthropic
```

Layering is strict: **routes** attach middleware/validation → **controllers** stay
thin → **services** own all business logic and DB access → **models** are the
database layer. Cross-cutting helpers: `ApiResponse`/`ApiError`/`errorHandler`
(consistent envelopes), `asyncHandler`, `pagination`, pino `logger`.

## 3. Authentication, sessions, tenant isolation & RBAC

- **Auth:** access JWT (15 min, carries `sub/tenantId/role/email`) + rotating
  refresh token (7 d) as an httpOnly cookie scoped to `/api/v1/auth`. Refresh
  tokens stored as SHA-256 hashes (capped to 5 active sessions).
- **Device sessions** mirror each refresh-token hash → session-management UI +
  per-device revocation. **Reuse detection** wipes the token family on a replayed
  token. Append-only **security-event** + **audit** logs; suspicious-login detection.
- **Tenant isolation:** the JWT's tenant is authoritative on authenticated
  requests (a conflicting `x-tenant-id` header → **403**). Public requests resolve
  the tenant from header/subdomain/verified custom domain. **Every query is scoped
  by `tenantId`** — verified by automated isolation tests.
- **RBAC:** `requireRole(...)` guards instructor/admin/superadmin routes; admin
  routers apply `requireRole('admin','superadmin')`, superadmin routes are
  superadmin-only.

## 4. Core data models & relationships

`Tenant` 1─* `User` (roles: student/instructor/admin/superadmin) · `User` *─*
`Course` via `Enrollment` · `Course` 1─* `Module` 1─* `Lesson` · `Lesson` 1─1
`Quiz`/`Assignment` · `Assignment` 1─* `Submission` · `Course`/`User` ← `Review`,
`Payment`, `Subscription`, `Certificate`, `Progress`, `Notification`,
`LiveSession`, `Coupon`. Platform models: `TenantSettings`, `WhiteLabel`,
`EmailTemplate`, `Session`, `SecurityEvent`, `AuditLog`, `AIConversation`,
`Affiliate`/`AffiliateReferral`/`AffiliateCommission`/`AffiliatePayout`.

## 5. Key API groups

`/auth` (incl. sessions + login history), `/courses` (+nested modules/lessons),
`/enrollments`, `/progress`, `/learn`, `/dashboard`, `/certificates`,
`/analytics` (public + instructor), `/reviews`, `/notifications`, `/users`,
`/live-sessions`, `/quizzes`, `/assignments`, `/upload`, `/payments` (+webhook),
`/coupons`, `/admin/*` (analytics, advanced analytics, users, courses, payments,
affiliates, white-label, security), `/tenant` (public config + signup),
`/superadmin/*` (tenants, global analytics, ops), `/ai/*`, `/marketplace/*`,
`/affiliate/*`. Full machine-generated list: `docs/API.md` (regenerate with
`npm run docs:api`).

## 6. Frontend structure

App Router route groups: `(main)` public/student, `(instructor)`, `(admin)`,
`(superadmin)` — each authenticated, data-driven group layout sets
`export const dynamic = 'force-dynamic'`. Data via typed TanStack Query hooks
(`hooks/use*.ts`) over a shared axios `apiClient` (injects bearer token + tenant
header, single-flight refresh on 401). Per-tenant branding applied at runtime from
`/tenant/config` (CSS variables + feature-flag gating). Reusable UI in
`components/ui` and area folders; every data view has loading/error/empty states.

## 7. Running locally

```bash
# Server (needs MongoDB on :27017)
cd server && cp .env.example .env   # set MONGODB_URI + JWT secrets
npm install && npm run seed:tenant && npm run seed:courses && npm run dev

# Client
cd client && cp .env.example .env.local   # set NEXT_PUBLIC_TENANT_ID
npm install && npm run dev
```

Verification: server `npm run typecheck && npm run build && npm test`; client
`npm run type-check && npm run build`. Env vars and Docker/Vercel deployment are
documented in `DEPLOYMENT.md`. Optional integrations (Stripe, Resend, Cloudinary,
OpenAI/Anthropic, Redis) all degrade gracefully when unset.

## 8. What was audited & fixed in this session

A full read-only audit ran first (route registration, RBAC, tenant scoping, type
safety, error handling, and a repo-wide TODO/placeholder/mock scan). Findings were
limited — the codebase had no Critical/High issues — and were fixed:

| Area | Before | After |
| --- | --- | --- |
| **Instructor dashboard revenue** (`analytics.service.instructorDashboard`) | `totalRevenue`/`monthlyRevenue`/per-course `revenue`/`completionRate` were hardcoded `0` with "Phase 4" comments — the UI's "Total revenue" card, revenue column, and chart always showed **$0**. | Computed from completed `Payment` records (total, this-month, last-month → growth, 12-month chart, per-course revenue) and from `Enrollment.progress` (per-course completion rate). |
| **Instructor earnings** (`analytics.service.instructorRevenue`) | Returned all zeros + empty arrays (stub). | Real totals, `availablePayout`, 12-month one-time/subscription split, per-course breakdown, and recent transactions from `Payment`. |
| **Type safety** | `e.userId as unknown as {…}` populate casts in `analytics.service`, `StudentProgressTable`, and a `data.meta as unknown` cast in `useInstructorStudents`. | Replaced with proper typed `.lean<T>()` results, a shared `StudentEnrollment` type, and `PaginatedResponse<T>` typing — **zero `as unknown` in app code** (only the necessary DOMPurify/JSDOM interop cast remains). |
| **Stale copy** | Direct paid-course enrollment 402 said "checkout is coming soon". | "This course requires payment — start checkout to enroll." |
| **Regression cover** | none for instructor revenue. | 3 integration tests asserting real revenue/completion and that pending payments don't count. |

Result: **38/38 tests pass**, server + client typecheck and build clean, no
circular dependencies.

## 9. Remaining technical debt (honest)

- **Admin 2FA** is a UI scaffold ("coming soon") — not implemented; out of the
  delivered scope.
- **Google OAuth** intentionally deferred (button disabled by design since Phase 2).
- **Email-template overrides** are wired into welcome + verification sends;
  password-reset and enrollment templates are managed/previewable but not yet
  wired into their send paths.
- **Affiliate & instructor payouts** are gross-revenue figures / admin-settled;
  no automated payout-provider integration or instructor-payout ledger yet.
- **Hosted AI providers** (OpenAI/Anthropic) are type-safe but exercised only via
  the local fallback in this environment (no live keys).
- **Test breadth** can grow (marketplace ranking, white-label DNS path, client
  component tests); no coverage thresholds enforced.
- **Pre-existing:** Next.js 14 framework `npm audit` advisories; OneDrive `.next`
  build flake (a retry passes).
