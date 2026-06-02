# NextLearn — OneDrive Cache Corruption Fix

Date: 2026-05-31

## Root Cause
The project lives under `C:\Users\user\OneDrive\Desktop\NextLearn`, a OneDrive-synced
path. OneDrive's real-time sync intercepts Next.js webpack writes to `.next/` during
compilation, then moves/uploads the files before Next reads them back. Terminal logs
confirmed it:
- `ENOENT: no such file or directory, stat '…\.next\cache\webpack\client-development\1.pack.gz'`
- `Cannot find module './9276.js'`
- `vendor-chunks\react-hook-form.js / @hookform.js / zod.js → Can't resolve`

The downstream symptom (flat navbar + empty page, 404 on `page.js`/`layout.css`) looked
like a code bug, but the source was correct all along — this was an **I/O race with
OneDrive**, which is why clearing `.next` only ever helped until the next compile. The
primary trigger is the webpack filesystem cache (`*.pack.gz`): when it's corrupted
mid-write, webpack can no longer resolve modules, cascading into the chunk failures.

## Fix Applied
1. **`client/next.config.mjs` — webpack cache moved out of OneDrive's reach:**
   - **dev:** `config.cache = { type: 'memory' }` → no `.pack.gz` files are written at
     all, so there is nothing for OneDrive to corrupt.
   - **build:** `config.cache.cacheDirectory = <os.tmpdir()>/nextlearn-webpack-cache` →
     the filesystem cache is written to the OS temp dir, outside the synced tree.
     (Verified: the temp cache dir is created on build.)
2. Cleared the corrupt cache: `rm -rf .next node_modules/.cache`.
3. `.gitignore` already ignores `.next/`, `node_modules/`, `.cache/` — no change needed.

## Residual / Recommended
The config fix removes the webpack **cache** (the proven trigger) from OneDrive. The
compiled `.next` **output** still lands in the synced folder, so for a 100%
bullet-proof setup, move the project off OneDrive:
```bash
mkdir -p /c/Projects/NextLearn
cp -r ~/OneDrive/Desktop/NextLearn/. /c/Projects/NextLearn/
# reopen /c/Projects/NextLearn in the editor
```
(Not done automatically — moving the project is the user's call and would relocate the
whole working tree.)

> Note on `attrib +P`: that flag is "Pinned" (Files-On-Demand: keep locally), not a
> sync exclusion — it does NOT stop OneDrive from syncing `.next`. The reliable options
> are the in-config cache relocation above and/or moving the project out of OneDrive.

## Prevention
- Never keep a Next.js project's `.next` inside a real-time sync folder
  (OneDrive/Dropbox/Google Drive) without relocating the webpack cache (done here) or
  excluding/moving the folder.
- If symptoms ever return: `rm -rf client/.next && npm run dev` (≈15s), and confirm the
  dev server logs no `ENOENT`/`Cannot find module`.

## Verification
- Client `tsc --noEmit`: exit 0 ✅
- Clean `next build`: exit 0, full route table emitted (incl. Phase 4 routes) ✅
- `ENOENT` occurrences in build: 0 ✅
- `Cannot find module` in build: 0 ✅
- Webpack build cache now created under the OS temp dir (outside OneDrive) ✅
