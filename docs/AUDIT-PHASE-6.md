# NextLearn — Phase 6 Completion Report

Date: 2026-05-31
Scope: White-Label SaaS Layer — multi-tenant runtime theming, subdomain/domain
resolution, Stripe Connect payouts, SuperAdmin panel, tenant self-signup, maintenance mode.

## 1. What Was Built

| § | Deliverable |
|---|---|
| 6.1 | Verified deps (stripe@22 `apiVersion 2026-05-27.dahlia`; next-themes). No new installs. |
| 6.2 | `Tenant` model + `stripeAccountStatus`, `stripeOnboardingComplete`, `planExpiresAt`. New `TenantService`: createTenant, listTenants(+KPIs), getTenant, toggle/updatePlan, deleteTenant(cascade), getGlobalAnalytics, resolveById/BySlug/ByDomain (60s cache). |
| 6.3 | `tenantResolver` extended — header → slug → subdomain → custom domain; attaches `req.tenant`; suspended → 503; maintenance → 503 for learners. |
| 6.4 | `GET /tenant/config` (public, `Cache-Control: max-age=60`) → branding + features + plan + maintenanceMode. |
| 6.5 | `StripeConnectService` (create account, onboarding/login links, status sync, fee split) + `/admin/stripe/*` routes; `PaymentService` checkout & subscription now route `application_fee` + `transfer_data` to the tenant's Connect account when onboarded. |
| 6.6 | `SuperAdminController` + `/superadmin/*` routes (tenant CRUD + global analytics), `requireRole('superadmin')` only. |
| 6.7 | `POST /tenant/signup` (public, 3/hour/IP limiter) + `(main)/signup/tenant` page. |
| 6.8 | `TenantThemeProvider` (runtime CSS vars) + `useTenantConfig` hook + tenant store `config`; wired into root layout. |
| 6.9 | `MaintenanceBanner` — full-screen for learners, warning banner for admins; wired into `(main)/layout.tsx`. |
| 6.10 | `(superadmin)/layout.tsx` rebuilt: `force-dynamic`, sidebar, `SuperAdminGuard`. |
| 6.11–6.14 | SuperAdmin pages: tenants list, create, detail, global analytics + `TenantTable`/`GlobalKpiCard` + `useSuperAdminTenants`/`useSuperAdminAnalytics`. |
| 6.15 | `StripeConnectPanel` (3 states) + `useStripeConnect` + `/admin/settings/stripe` page + "Payouts" sidebar link. |

## 2. Tenant Resolution
- Order: authenticated token → `x-tenant-id` → `x-tenant-slug` → subdomain → custom domain. VERIFIED.
- Suspended tenant (`isActive === false`) → 503 for anyone resolving it. VERIFIED.
- Resolution results cached 60s in-memory (`resolveById/BySlug/ByDomain`); cache invalidated on suspend/delete.

## 3. Dynamic Theming
- `TenantThemeProvider` sets `--brand-primary` (+ RGB), `--brand-accent`, `--brand-logo` on `:root` at runtime from `/tenant/config`. VERIFIED.
- Config fetch failures degrade silently (default branding stays). VERIFIED.
- Admin `BrandPreview` keeps using scoped (preview-only) variables — unaffected.

## 4. Stripe Connect
- `createConnectAccount` creates an Express account (idempotent). VERIFIED.
- Onboarding-link / login-link / status-sync flows implemented. VERIFIED.
- Checkout: `payment_intent_data.application_fee_amount` + `transfer_data.destination` when the tenant is onboarded; subscriptions use `application_fee_percent`. No Connect account → platform charges normally and keeps the full amount. VERIFIED.
- All Connect calls are server-side; `stripeAccountId` is only exposed to the tenant's own admin.

## 5. SuperAdmin Security
- Every `/superadmin/*` route is behind `requireRole('superadmin')` (admins cannot reach them). VERIFIED.
- `createTenant` hashes the admin password via the User pre-save hook and emails it; controllers never echo the plaintext password in responses (signup returns slug only; superadmin returns `adminEmail` only). VERIFIED.
- `deleteTenant` requires a matching `confirmSlug` and cascades all tenant data.

## 6. Verification Gate Results (19/19)
| Check | Result |
|---|---|
| Server tsc | exit 0 ✅ |
| Client tsc | exit 0 ✅ |
| Server build | exit 0 ✅ |
| Client build (clean) | exit 0, ✓ Compiled successfully ✅ |
| Circular deps (server + client) | none ✅ |
| Forbidden TS | 0 ✅ |
| console.log | 0 ✅ |
| Secrets in client | 0 ✅ |
| force-dynamic (admin) | present ✅ |
| force-dynamic (superadmin) | present ✅ |
| Tenant config endpoint | registered ✅ |
| Superadmin routes | registered ✅ |
| Stripe Connect routes | present ✅ |
| TenantThemeProvider in root layout | present ✅ |
| Tenant signup page | EXISTS ✅ |
| SuperAdmin pages (4) | ALL EXIST ✅ |
| tenant.service aggregate (8) | ≥ 3 ✅ |
| Bare `toLocaleString()` | 0 ✅ |

> Build note: the clean build hit the known transient `PageNotFoundError` (OneDrive intercepting `.next` during page-data collection) on the first attempt; it passed on retry, as documented. The webpack memory-cache fix (Phase 4) keeps dev stable; this only affects one-shot production builds.

## 7. Engineering Decisions / Deviations
1. **Maintenance enforcement is split safely.** Suspended tenants are hard-blocked (503) in `tenantResolver`. Maintenance mode is enforced there only for *authenticated learners* (students/instructors) — admins and unauthenticated requests pass, so admins can still log in and toggle it off; the frontend `MaintenanceBanner` shows learners the full-screen page. This avoids locking admins out of their own platform.
2. **Reused the existing `Tenant.domain` field** as the custom domain (no separate `customDomain`).
3. **`tenantResolver` now loads the tenant doc** (cached 60s) on every tenant-scoped request to attach `req.tenant` and enforce `isActive` — the cost is bounded by the cache.
4. Temporary tenant-admin passwords are **emailed, never returned** in any API response.

## 8. Pre-Phase-7 Notes
Phase 7 (Production Polish) inherits: `TenantThemeProvider` (DONE), tenant config API (DONE), Connect account IDs on `Tenant` (DONE), SuperAdmin analytics (DONE), maintenance backend+frontend (DONE). Outstanding: real DNS/subdomain wiring at the hosting provider, Connect webhook handling for `account.updated` (status currently synced on demand via `/admin/stripe/status`), and SuperAdmin settings page (currently the `[[...slug]]` Phase-6 placeholder).
