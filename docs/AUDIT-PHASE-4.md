# NextLearn — Phase 4 Completion Report

Date: 2026-05-31
Scope: Payments — Stripe Checkout, Subscriptions, Webhooks, Coupons, Access Control

## 1. What Was Built

| § | Deliverable |
|---|---|
| 4.1 | Installed `stripe` (server) + `@stripe/stripe-js`, `@stripe/react-stripe-js` (client). Skipped the deprecated `@types/stripe` stub (Stripe ships its own types; the stub conflicts). |
| 4.2 | Extended `env.ts` with Stripe price IDs + success/cancel URLs; created `config/stripe.ts` singleton + `isStripeConfigured()`; updated both `.env.example` files. |
| 4.3 | `PaymentService` — checkout (one-time, server-priced), subscription checkout, billing portal, history, getSubscription, verifySession, and webhook helpers (`markSessionCompleted`, `markRefundedByIntent`). |
| 4.4 | `CouponService` — validate (5 checks), atomic `applyCoupon` (`$inc`), create/list/update/delete (soft-delete when used). |
| 4.5 | `EnrollmentService` extended — idempotent `createEnrollment`, `checkAccess` (4 conditions), `enrollFree`, `refundEnrollment`. |
| 4.6 | `WebhookController` — signature-verified, raw-body, idempotent handlers for checkout.session.completed, customer.subscription.{created,updated,deleted}, invoice.payment_failed, charge.refunded. |
| 4.7 | Payment + Coupon controllers, routes, and Zod validations. |
| 4.8 | Enrollment routes: `POST /free`, `GET /check/:courseId`, `GET /:courseId/access/:lessonId`. |
| 4.9 | `requireEnrollment` middleware (+ entity-aware `requireEnrollmentForQuiz`/`requireEnrollmentForAssignment`). |
| 4.10 | Payment success (confetti + session verify), cancel, and loading pages. |
| 4.11 | Subscription management page + `useSubscription` hooks (checkout/subscribe/portal/validate/free). |
| 4.12 | `CourseEnrollCard` (coupon + live price + enroll/subscribe), wired into the course detail page via `CourseSidebar`. |
| 4.13 | Billing page (Purchases / Subscription tabs) + `usePayments` hook. |
| 4.14 | Learn-page access guard: `useLessonAccess` + `AccessDenied` overlay. |
| 4.15 | Webhook mounted with `express.raw()` **before** `express.json()`; payment/coupon routes registered. |

## 2. Stripe Security
- Webhook signature verified with `constructEvent`: **YES** (`webhook.controller.ts:36`).
- Webhook route uses raw body (not json()): **YES** (`app.ts` — `express.raw()` mounted before `express.json()`).
- `STRIPE_SECRET_KEY` never in client code: **VERIFIED** (gate check 9 = 0).
- Idempotency: `markSessionCompleted` only returns a payment id on the first pending→completed transition (so enrollment + coupon side-effects run once); `createEnrollment`, `refundEnrollment`, and subscription upserts are all idempotent; the endpoint always returns 200 so Stripe stops retrying processed events.
- All amounts handled in integer cents; coupon math is integer-only.

## 3. Access Control
- `EnrollmentService.checkAccess` checks all four conditions: **YES** (free lesson, active enrollment, active subscription, instructor/admin).
- `requireEnrollment` applied to: `GET /progress/:courseId`, `POST /quizzes/:id/attempts` (entity-aware), `POST /assignments/:id/submissions` (entity-aware). The lesson `GET` route intentionally keeps its existing **graceful preview-locking** (returns stripped content + `isLocked`, not a hard 403) for a better preview UX; the frontend `AccessDenied` overlay enforces the gate visually.
- Free courses bypass payment: **YES** (`POST /enrollments/free`, rejects paid with 400).
- Frontend access guard on learn page: **YES** (`AccessDenied` over the player when `/enrollments/:courseId/access/:lessonId` → 403).

## 4. Coupon System
- `usedCount` increment is atomic (`$inc`): **YES** (`coupon.service.ts:80`), and only fired post-payment in the webhook.
- Validation checks all 5 conditions: **YES** (exists+tenant, active, not expired, under maxUses [`0`=unlimited], applicable to course).
- UI on course detail page: **YES** (`CourseEnrollCard` with live savings + final price).

## 5. Verification Gate Results
| Check | Result |
|---|---|
| Server tsc | exit 0 ✅ |
| Client tsc | exit 0 ✅ |
| Server build | exit 0 ✅ |
| Client build | exit 0, "✓ Compiled successfully" ✅ |
| Circular deps server | none ✅ |
| Circular deps client | none ✅ |
| Forbidden TS (`any`/`@ts-ignore`/`as unknown`) | 0 ✅ |
| console.log | 0 ✅ |
| Stripe secret in client | 0 ✅ |
| Raw body on webhook | VERIFIED ✅ |
| constructEvent present | VERIFIED ✅ |
| Atomic coupon increment | VERIFIED ✅ |
| Access guard on quiz/assignment | VERIFIED ✅ |
| Routes registered | VERIFIED ✅ |
| Free enrollment route | VERIFIED ✅ |
| Server boot smoke test | BOOT_OK ✅ |

## 6. Engineering Decisions / Deviations from Spec
1. **Stripe env vars kept OPTIONAL** (not `.min(1)`). Making them required would crash boot for the existing dev/seed environment that has no billing configured — breaking verified Phases 1–3. Instead, payment endpoints guard with `isStripeConfigured()` and return **503** when unconfigured, and the Stripe client constructs with a placeholder key so the process boots.
2. **`apiVersion` pinned to `2026-05-27.dahlia`** (the installed SDK's version) rather than the spec's `2024-11-20.acacia` — the SDK's config type only accepts its own pinned literal.
3. **Stripe types** are accessed via aliases derived from the SDK instance (`StripeCheckoutSession`, `StripeSubscription`) plus `obj.object` discriminant narrowing, because stripe@22 exposes its `Stripe.*` namespace only through its `exports` map (unreachable under the project's classic Node module resolution). No `as any`/`as unknown` used.
4. **`current_period_end`** is read from `subscription.items.data[0]` (it moved off the subscription root in recent API versions).
5. Added `Subscription.stripeCustomerId` and `Payment.stripeReceiptUrl` (explicitly sanctioned by §4.6/§4.13). Effective price now respects `salePrice` server-side before coupons.

## 7. Pre-Phase-5 Notes
Phase 5 (Admin Panel) can build on:
- **Payment list endpoint for admin**: per-user history exists (`GET /payments/history`); a tenant-wide admin list is NOT yet built — add `GET /admin/payments`.
- **Coupon CRUD for admin**: DONE (`/coupons` create/list/update/delete, admin-guarded).
- **Subscription management for admin**: per-user `getSubscription` + Stripe portal exist; a tenant-wide admin subscription list is NOT yet built.
- **Revenue data for admin analytics**: `Payment` documents (status, amount in cents, type, timestamps) are the source of truth; an aggregation endpoint is NOT yet built.
