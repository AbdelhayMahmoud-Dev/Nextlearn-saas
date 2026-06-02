# NextLearn — Phase 4 Layout Fix

Date: 2026-05-31

## Root Cause
**Stale `.next` build cache** — not a code bug. After Phase 4 added new route
segments (`/payment/*`, `/subscription`, `/billing`), new client components, and
changed `CourseSidebar`'s boundaries, the running dev server's `.next` still held
chunks hashed against the *old* source. The browser requested chunk paths that no
longer existed → `GET /_next/static/chunks/app/(main)/page.js 404` and
`.../layout.css 404`, leaving the page shell empty and the navbar unstyled.

This was confirmed by verifying the committed source is correct:
- `tsc --noEmit` (server + client): exit 0.
- `madge --circular`: no cycles.
- A clean `rm -rf .next && next build`: **✓ Compiled successfully**, with every
  Phase 4 route present (`/payment/success`, `/payment/cancel`, `/subscription`,
  `/billing`) — i.e. the chunks regenerate correctly from current source.
- Live DOM inspection of a freshly-started server showed the homepage rendering
  all 8 sections with the category dropdown panel correctly `visibility: hidden`
  (categories nested inside it, not flat in the header).
- Spot checks: all hook-using components have `'use client'`; `AccessDenied` and
  `payment/cancel` correctly omit it (no hooks); webhook `express.raw` is mounted
  before `express.json`; payment/coupon routes registered; access guards in place.

## Fix Applied
```bash
cd client
rm -rf .next
npm run build      # (or: npm run dev) — regenerates chunks from current source
```
For the running dev server: **stop it first** (Ctrl+C), then `rm -rf client/.next`
and `npm run dev`. Do not run two `next dev`/`next build` processes against the
same `client/.next` at once — concurrent access corrupts the cache and produces a
transient "Page not found" flake.

## Prevention
After any large batch of Next.js changes (new route segments, new Server/Client
component boundaries, new hooks), ALWAYS clear the cache before relying on the
output:
```bash
rm -rf client/.next && npm run dev   # or npm run build
```
A stale `.next` cache is the most common cause of 404-chunk errors in this project
(also seen after Phase 3). It is an environment/caching issue, not a source defect.

## Verification
- tsc server: exit 0 ✅
- tsc client: exit 0 ✅
- next build (clean): ✓ Compiled successfully, all routes present ✅
- madge (client): no circular deps ✅
- Forbidden TS / console.log / Stripe-secret-in-client: 0 / 0 / 0 ✅
- Webhook raw body before express.json: verified ✅
- Homepage renders all 8 sections (live DOM): ✅
