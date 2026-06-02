# NextLearn — UI Layout Fix

Date: 2026-05-31

## Root Cause

Two distinct things were going on; only one was an actual code bug.

1. **The real code bug — locale hydration mismatch (FIXED).**
   Several components formatted numbers with a bare `toLocaleString()` (no locale
   argument). This machine's Node/server locale resolves to **Arabic**, so the server
   rendered Arabic-Indic digits (e.g. `٢`, `٦`) while the browser rendered Western digits
   (`2`, `6`). React flagged a hydration mismatch on every affected node:

   ```
   Warning: Text content did not match. Server: "٢" Client: "2"
       at StarRating ... at CourseCard ... at CourseGrid ... at HomePage (Server)
   ```

   This is also why the very first session's hero stats showed `٦+ / ١٦+ / ١+`.
   On the homepage the trigger was `StarRating` (used by featured course cards). Hydration
   mismatches make React discard and re-render the affected subtree on the client, which
   produces visible flicker and — combined with a stale dev bundle — a janky/empty-looking
   render in `next dev`.

2. **The reported "flat navbar / empty page" did NOT reproduce in a clean dev server.**
   Verified live (fresh `next dev`, desktop viewport) via DOM inspection:
   - Visible nav text is only **"Courses"** — the 8 categories sit inside an
     `position: absolute; visibility: hidden; opacity: 0` panel revealed on hover.
   - The homepage renders **8 sections** (hero, featured, categories, how-it-works,
     testimonials, pricing, CTA) with `<h1>` present and **no error overlay**.

   The committed `NavCategoryDropdown`, `PageTransition`, `Navbar`, and `StatCounter` are
   structurally correct (`'use client'` present, no `position: absolute` on the transition
   wrapper, categories nested in the hidden panel). The broken render the screenshot showed
   was a **stale `.next` / desynced HMR state** left over from the previous session's large
   batch of new files and changed client/server boundaries — the classic cause of a
   half-compiled bundle. A clean restart renders correctly.

   **Action for that symptom:** stop the dev server and restart with a clean cache:
   `rm -rf client/.next && (cd client && npm run dev)`.

## Files Changed

| File | Fix |
|---|---|
| `client/components/course/StarRating.tsx` | `count.toLocaleString()` → `toLocaleString('en-US')` (homepage hydration-mismatch source) |
| `client/components/instructor/DashboardOverviewCards.tsx` | 3× bare `toLocaleString()` → `'en-US'` |
| `client/app/(instructor)/instructor/earnings/page.tsx` | 6× bare `toLocaleString()` → `'en-US'` |
| `client/components/instructor/TopCoursesTable.tsx` | revenue `toLocaleString()` → `'en-US'` |
| `client/app/(main)/courses/[slug]/page.tsx` | `enrolledCount.toLocaleString()` → `'en-US'` |

No changes were needed to `NavCategoryDropdown.tsx`, `PageTransition.tsx`, `Navbar.tsx`,
`MobileNav.tsx`, `StatCounter.tsx`, `Footer.tsx`, `CategoryGrid.tsx`, the home sections, or
the `(main)` layout — they were inspected and confirmed correct.

## Verification

- Client `tsc --noEmit`: exit 0 ✅
- `next build`: exit 0, "✓ Compiled successfully" ✅
- Bare `toLocaleString()` remaining: 0 ✅
- `any` / `@ts-ignore`: 0 ✅
- **Live browser check (fresh dev server):** no Arabic digits in DOM, no React hydration
  error, navbar shows only "Courses" (8 categories hidden in dropdown panel), 8 page
  sections render, no error overlay ✅
