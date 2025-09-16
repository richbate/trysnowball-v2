# DEV_BACKLOG.md

This backlog is the next actionable set of engineering tasks post–Phase 3 hardening (PR #4).  
Constraints: no legacy storage writes, CP‑1 facade pattern only (debtsManager → localDebtStore), keep bundle < 400KB.

---

## ✅ 0) Merge PR #4 (Phase 3 hardening)
**Goal:** Land all stability + guardrails work on main.

- **Action:** Merge PR #4 from `cleanup/remove-legacy-myplan-and-hooks`.
- **Verify:** CI green; smoke test in staging:
  - `/my-plan/debts`: demo → reorder → edit → history → clear → demo (no console errors)
  - `/upgrade`: Free shows pricing, Pro unlocked by webhook/coupon
  - Auth: login → logout → login (no legacy calls)

---

## 1) Settings in Store (CP‑1)
**Goal:** Persist UI + app preferences via Dexie store, not facades.

- **Files:** `src/data/localDebtStore.ts`, `src/lib/debtsManager.js` (facade), optional `src/hooks/useSettings.ts`.
- **Implement:**
  - `localDebtStore.getSettings(): Promise<{ currency: string; locale: string; ... }>`
  - `localDebtStore.setSettings(settings: object): Promise<void>`
  - Migrate any `debtsManager.getSettings()` callers to facade → store.
- **Acceptance:**
  - App renders without fallback warnings.
  - Settings survive refresh and are read only through facade → store.
  - No `localStorage.setItem` for settings.

---

## 2) Progress Thermometer (Debts Header)
**Goal:** Motivating visual of paid vs original at `/my-plan/debts`.

- **Files:** 
  - `src/components/ux/ProgressThermometer.tsx` (new)
  - Wire in `src/pages/MyPlan/DebtsTab.jsx` (or header).
- **Data:** Use `usePlanTotals()` if it exposes `originalTotal`; else derive from debts (`initialBalance` || `balance`).
- **Acceptance:**
  - Shows Paid / Remaining / Original; percentage correct; zero‑safe.
  - No new deps, no console errors in empty state.

---

## 3) Content‑First Home
**Goal:** Surface Library + Money Makeover above the fold.

- **Files:**
  - `src/pages/HomeContentFirst.jsx` (new)
  - Patch `src/pages/Home.jsx` to render it at top.
- **Content:** Three featured guides + "Start the Makeover" CTA; keep "Open My Plan".
- **Acceptance:** 
  - `/` shows content hero, featured guides, makeover CTA.
  - All links route correctly; mobile/desktop layout solid.

---

## 4) Legacy Code Removal (Final Sweep)
**Goal:** Delete dead code now guarded by CI.

- **Candidates (only if imports=0):**
  - `src/lib/dataManager.js`
  - `src/storage/localDebtManager.ts`
  - `src/hooks/useCloudDebts.js`
  - Any `*MyPlan.jsx.backup` / unused pages
- **Scripts:** CI already blocks legacy patterns; add imports check if needed.
- **Acceptance:** Build green; `rg -n "dataManager|localDebtManager|useCloudDebts" src` → no imports.

---

## 5) Router v7 Future Flags
**Goal:** Remove upgrade warnings without behaviour change.

- **Files:** Router root (where `<BrowserRouter>` is created).
- **Change:**
  - Add `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}`
- **Acceptance:** No v7 future warnings; navigation unchanged.

---

## 6) Debt Math Precision (Min Payment)
**Goal:** Align engine with MATH_PROOF assumptions.

- **Files:** `src/utils/DebtEngine.js` (and tests in `__tests__/DebtEngine.test.js`).
- **Change:** Ensure `minPayment` derives from debt data (or validated fallback), not a naive `balance * 0.02`.
- **Tests:** Increasing extra payment by £250 reduces payoff months; no regressions on interest calc.
- **Acceptance:** Unit tests pass; timeline shifts sensibly with extra payments.

---

## 7) Lifecycle Nudges (Retention)
**Goal:** Monthly balance update prompt; return nudge.

- **Server:** Worker cron (monthly) to enqueue reminder (email or in‑app flag).
- **Client:** On visit, if `lastBalanceUpdate > 30 days`, show banner CTA linking to `/my-plan/debts`.
- **Files:** `src/hooks/useLifecycleNudges.ts`, `src/components/banners/BalanceReminder.jsx` (new).
- **Acceptance:** 
  - No spam; banner dismissible; stores dismissal in `localDebtStore.settings`.
  - QA by faking `lastBalanceUpdate` date.

---

## 8) Analytics Events (Light Instrumentation)
**Goal:** Measure the new/critical flows.

- **Events:** 
  - `content_hero_viewed`, `featured_guide_clicked {slug}`, `makeover_cta_clicked`
  - `thermometer_rendered {pct}` (sampled)
- **Files:** wherever PostHog wrapper lives (`lib/posthog`), add tiny utility and call sites.
- **Acceptance:** Events appear in dev PostHog; gated for production only.

---

## 9) CI Guard Extension (keep tight)
**Goal:** Prevent reintroduction of legacy APIs.

- **Files:** `scripts/check-no-legacy.sh`
- **Add patterns:**
  - `\\bdataManager\\b import`
  - `\\bsetUserStorageKey\\b|\\bgetUserStorageKey\\b` (already added)
  - `localStorage\\.setItem\\s*\\(\\s*['\"]debt` (already added)
- **Acceptance:** CI fails if patterns reappear.

---

## 10) Docs Refresh (Developer‑facing)
**Goal:** Keep docs consistent with latest decisions.

- **Files:** `ARCHITECTURE.md`, `FOLLOW_UPS.md`, `CHANGELOG.md`
- **Updates:**
  - Note: Settings now live in `localDebtStore`.
  - Add: Content‑first Home and Thermometer shipped.
  - Mark: Legacy removals complete.
- **Acceptance:** Docs match code; new contributors can follow the data flow quickly.

---

## Quick Commands

- Search imports:  
  `rg -n "dataManager|localDebtManager|useCloudDebts" src`
- Legacy patterns check (local):  
  `./scripts/check-no-legacy.sh`
- Run tests:  
  `npm test` (unit) / `npm run cypress:open` (e2e, if configured)

---

## Definition of Done (for this batch)

- CI green; no new legacy violations.
- No console errors on `/`, `/my-plan/debts`, `/upgrade`.
- Bundle size still < 400KB gzip (no new deps).
- Docs updated; CHANGELOG entry added.