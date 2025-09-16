# TrySnowball SDLC (Software Development Life Cycle)

## 1. Branching & Development
- **ALWAYS** create a new branch from `main` for any new feature, fix, or refactor.
  - Branch name format: `feature/<short-desc>` or `fix/<short-desc>`
  - Example: `feature/library-lite` or `fix/auth-timeout`
- All code changes are committed to **your branch only**.
- Pull latest `main` before branching to avoid stale bases.

## 2. Local Testing
- Run the full local build & test cycle **before pushing**:
  - `npm run build` (ensure no compile errors)
  - `npm run lint` (fix any warnings/errors)
  - Manual functional tests for core flows:
    - Login / Auth
    - Debt entry + save
    - AI coach basic prompt
    - Library article load

## 3. Staging
- Open a PR from your branch → `staging` branch.
- **Skip staging** only if:
  - The change is trivial (e.g., copy updates) **and**
  - It has zero risk to authentication, data storage, routing, or payments.
- On merge to `staging`:
  - Staging environment auto-deploys to `staging.trysnowball.co.uk`
  - QA checklist:
    - Core flows functional
    - No console errors
    - No 500/404 errors in network tab
    - No regressions in navigation or layout
    - New features behaving as intended

## 4. Approval to Prod
- Once staging passes QA:
  - Merge `staging` → `main`
  - Production auto-deploys to `trysnowball.co.uk`
  - Post-deploy check: confirm no cached assets causing UI break
- If a hotfix is needed:
  - Create branch from `main`
  - Test locally → PR to `staging` → QA → merge to `main`

## 5. Rollback
- If production breaks:
  - Immediately revert `main` to last known good commit (`git revert` or Cloudflare Pages rollback)
  - Apply fix in new branch → staging → prod

## 6. Rules & Discipline
- **No direct commits to `main`**
- **No untested merges to staging**
- **No production deploy without staging QA**
- Every PR **must** have:
  - Summary of changes
  - Testing steps
  - Risk assessment

---

**Goal:** Eliminate production-breaking changes by ensuring all work is developed, tested, and validated in isolation before hitting live users.