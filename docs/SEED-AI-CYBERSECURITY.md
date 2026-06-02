# NextLearn — AI & Cybersecurity Courses Added

Date: 2026-05-31

The two new-category courses (previously short session-1 stubs) were replaced with full,
production-quality course content in `server/src/scripts/seedCourses.ts`.

## Courses Added

### Artificial Intelligence: From Zero to Builder
- Category: ai-ml
- Level: beginner
- Price: Free
- Featured: yes
- Modules: 5 | Lessons: 20
- Outcomes: 7
- Thumbnail: photo-1677442135703-1787eea5ce01

### Cybersecurity Fundamentals: Think Like a Hacker, Defend Like a Pro
- Category: cybersecurity
- Level: beginner
- Price: $49.99 (sale: $29.99)
- Featured: yes
- Modules: 7 | Lessons: 28
- Outcomes: 8
- Thumbnail: photo-1550751827-4bd374c3f58b

## How to Re-seed
```bash
cd server
npm run seed:tenant    # (only needed once — creates the demo tenant)
npm run seed:courses   # clean re-seed of the demo catalog (now 8 courses)
```

## Verification
- Server `tsc --noEmit`: exit 0 ✅
- `npm run seed:courses`: exit 0 ✅ — logged:
  - `Seeded course: Artificial Intelligence: From Zero to Builder (20 lessons)`
  - `Seeded course: Cybersecurity Fundamentals: Think Like a Hacker, Defend Like a Pro (28 lessons)`
  - `✅ Seeded 8 courses for tenant "demo"`
- `any` / `@ts-ignore` in `server/src`: 0 ✅
- `console.log` in `server/src` (excl. seed/logger): 0 ✅
- Homepage wiring confirmed: `client/app/(main)/page.tsx` fetches `/courses/categories` and
  passes `counts={categoryCounts}` to `<CategoryGrid />`, so the AI and Cybersecurity cards now
  show real counts instead of "1".

> Note: `mongosh` is not installed on this machine, so the direct DB query (Step 5, Option A)
> was skipped — the seed script's exit 0 + per-course log lines are the authoritative evidence
> that both courses were written to MongoDB (`127.0.0.1/nextlearn`, tenant "demo").
