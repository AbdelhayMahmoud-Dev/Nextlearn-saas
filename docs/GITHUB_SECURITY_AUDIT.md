# NextLearn — GitHub Security & Identity Audit

Date: 2026-06-02
Repository: `AbdelhayMahmoud-Dev/Nextlearn-saas`
Auditor roles: Senior Staff Engineer · Git Expert · Security Auditor

---

## 1. Contributor Analysis

**Finding:** Claude appeared as a GitHub *contributor* even though **every commit
was already authored and committed by the repository owner.**

Pre-rewrite state (verified from `git log`):

| Metric | Value |
| --- | --- |
| Total commits | 14 |
| Distinct authors | 1 — `Abdelhay Mahmoud Mohammad <kamreyvg78@gmail.com>` |
| Distinct committers | 1 — `Abdelhay Mahmoud Mohammad <kamreyvg78@gmail.com>` |
| Commits with a `Co-Authored-By: Claude …` trailer | 13 |

**Root cause:** Claude was never the author or committer. GitHub generates the
"contributor" attribution from the **`Co-Authored-By: Claude Opus 4.8
<noreply@anthropic.com>`** trailer present in 13 commit message bodies. GitHub
parses co-author trailers and credits them as contributors.

**Remediation:** Strip the `Co-Authored-By: Claude …` trailer from all commit
messages via a history rewrite (author/committer identity already correct, so no
identity change was required) and force-update the remote.

## 2. Git History Changes

- Rewrote **all commit messages** with `git filter-branch --msg-filter` to delete
  any line matching `^Co-[Aa]uthored-[Bb]y: Claude`.
- **Preserved:** commit order, subjects/bodies, author & committer names, emails,
  and timestamps. Only the Claude trailer lines were removed.
- Removed the `refs/original/*` backups, expired reflogs, and ran `git gc
  --prune=now` so no rewritten-away commit remains reachable locally.

Post-rewrite verification:

```
$ git log --all --format="%an <%ae>" | sort -u
Abdelhay Mahmoud Mohammad <kamreyvg78@gmail.com>      # only identity

$ git log --all --format="%B" | grep -ic "claude"           # → 0
$ git log --all --format="%B" | grep -ic "co-authored-by"   # → 0
```

The rewritten history was force-pushed to `origin/main` with
`--force-with-lease` (after a fetch to confirm the remote tip), so GitHub now
reflects the cleaned history and Claude will no longer be listed as a contributor.

> Note: a history rewrite changes commit SHAs. This is a solo repository with no
> other collaborators, branches, or open PRs, so the blast radius is nil.

## 3. Sensitive Data Audit

Scanned current files, **all tracked files**, and **full git history**.

| Check | Result |
| --- | --- |
| `.env` / `.env.local` / `.env.production` / `.env.*` tracked | **None** (only `*.env.example` templates) |
| Secret files (`*.pem/*.key/*.crt/*.p12`) tracked | **None** |
| Env/secret files ever present in history (`git log --all --full-history`) | **None** |
| Live secret patterns in tracked files (Stripe `sk_live`/`sk_test`/`whsec_`, AWS `AKIA…`, OpenAI `sk-…`, Anthropic `sk-ant-…`, Mongo URI with credentials, PEM private keys) | **None** |
| `.env.example` contents | Placeholders only (`change-me-…`, empty values, localhost URIs) |

Local untracked files containing real values — **`server/.env`** and
**`client/.env.local`** — exist on disk only, are git-ignored, and were **never
committed**. They are not exposed.

## 4. Files Removed From Tracking

**None required.** `git ls-files` contained no secret-bearing files; nothing had
to be `git rm --cached`. The only env files tracked are the safe
`server/.env.example` and `client/.env.example` templates (intentionally kept).

## 5. .gitignore Improvements

The existing ignore file was strong but had real gaps that were closed:

| Added | Why |
| --- | --- |
| `.env.*` (blanket) + `!.env.example` / `!.env.*.example` | Previously `.env.production`, `.env.development`, `.env.test` were **not** matched by any rule. |
| `*.pem`, `*.key`, `*.crt`, `*.p12`, `*.pfx`, `secrets/`, `*.secret` | No protection for keys/certs before. |
| `uploads/` | Runtime upload artifacts. |

Verified with `git check-ignore`: `server/.env`, `client/.env.local`,
`.env.production`, `*.pem`, `*.key` → **ignored**; `server/.env.example` /
`client/.env.example` → **still tracked**.

## 6. Security Findings

| Severity | Finding |
| --- | --- |
| CRITICAL | None |
| HIGH | None |
| MEDIUM | None |
| LOW | `Co-Authored-By: Claude` trailers caused spurious GitHub contributor attribution — **resolved** by the history rewrite. |
| INFO | `config/stripe.ts` uses a non-secret placeholder string (`sk_test_unconfigured_placeholder`) so the process boots without Stripe; `vitest.config.ts` defines dummy test-only JWT secrets. Neither is a real credential. |

No real credentials were found in the working tree, the tracked file set, or git
history.

## 7. Final Public Repository Readiness

- ✅ No secrets tracked; none in history.
- ✅ `.gitignore` blocks all env variants, keys, certs, uploads.
- ✅ Real `.env` files are local-only and ignored.
- ✅ All commits owned solely by the repository owner.
- ✅ No Claude attribution (author, committer, or co-author trailer) anywhere.
- ✅ Server + client typecheck, build, and the test suite pass.

### Final Verdict

**PUBLIC GITHUB SAFE = YES**
