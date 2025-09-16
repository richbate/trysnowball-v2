TrySnowball - TODO List

✅ CRITICAL FIXES COMPLETED (2025-08-24)

✅ Crash class eliminated via normalization + tests
• Fixed runtime crashes: "reduce is not a function", "Cannot read properties of undefined" 
• Implemented toDebtArray() normalizer ensuring arrays at all boundaries
• Added defensive guards in useDebts hook with try-catch + fallback values  
• Created no-op deprecation shims preventing legacy storage crashes

☑️ CI coverage thresholds for utils/debts, lib/debtsManager
• Added 90%+ coverage requirements for crash-critical files
• Enhanced GitHub Actions CI with crash prevention test step
• Coverage gates prevent regression of defensive measures

☑️ Add smoke test for demo clear/reload (Cypress)
• cypress/e2e/crash-prevention-smoke.cy.js covers exact crash scenarios
• Tests demo clear → empty state → reload demo without UI breaking
• Catches malformed localStorage handling and page refresh stability

⸻

📋 BACKLOG ITEMS

☑️ Silence Router v7 warnings (low priority)
• Set future flags when next touching routing code
• These warnings don't affect functionality, park for later

⸻

🔐 High Priority Issues

Investigate /api/user 401 Error on Page Load

(still valid, keep as-is)

⸻

Remove Google Adsense code entirely

(if still present — check build output; otherwise ✅ remove section next pass)

⸻

Review files not updated in 30 days

(still good housekeeping, keep list)

Candidates for cleanup or deletion
	•	src/env.js – Usually just reads process.env vars. If we’ve centralised config already, this could be folded into one shared config.js.
	•	src/reportWebVitals.js – Default CRA scaffold. If we’re not actively tracking web vitals, remove it.
	•	src/setupTests.js – Only needed if running Jest tests. If not, delete.
	•	src/utils/logger.js – Check if anything imports it. If not, remove; if yes, merge into shared debug util.

Core but stable files (fine untouched, but worth reviewing for cruft)
	•	src/components/AppErrorBoundary.jsx – Ensure it logs errors somewhere (could add PostHog tracking).
	•	src/components/OfflineBanner.jsx – Confirm it matches current offline detection via useOnlineStatus.
	•	src/components/PageSkeleton.jsx – Likely fine; loading skeleton.
	•	src/hooks/useOnlineStatus.js – Verify event listeners are correct across browsers.

Potentially stale / missed in refactors
	•	src/contexts/UserContextUnified.js – May still have legacy logic from pre-magic-link days.
	•	src/pages/ThankYou.js – Check alignment with current referral/milestone share system.
	•	src/utils/debtEngineAdapter.js – Verify no duplicate calc logic since “unified calculator” refactor.

⸻

🔧 Fix GPT Environment Configuration

(still valid — banner issue reported)

Issue: “AI parsing is not available” banner during debt paste import
Root Cause: Missing GPT env vars:
	•	REACT_APP_GPT_ENDPOINT
	•	REACT_APP_GPT_API_KEY
validateGPTEnvironment() fails → triggers fallback

Impact: Feature works with fallback but UX suffers.

Possible Solutions:
	1.	Configure endpoint/API key in .env.
	2.	Suppress warning in demo/development.
	3.	Remove GPT dependency, use fallback only.
	4.	Reword banner (“Enhanced parsing unavailable”).

Files Affected:
	•	src/components/DebtPasteInput.jsx
	•	src/config/gptConfig.js
	•	src/hooks/useGPTAgent.js

Priority: Medium

⸻

✅ Recently Fixed
	•	0% Interest Rates in Debt Forms
	•	Debt Management Loading & Display Issues

⸻

🚨 Critical Path (Architecture & Product)

CP-0 — Simplify Plans + Introduce Redux (RTK)

Goal: Two-tier plans (free vs pro) with optional trial expiry. Replace scattered contexts/flags with Redux Toolkit store.
	•	Backend: JWT payload = { entitlement: 'free'|'pro', pro_expires_at: string|null }
	•	Migration: convert legacy beta → free or pro trial
	•	Frontend: implement Redux slices (auth, debts, ui, flags)
	•	Add <FeatureGate required="pro"> wrapper
	•	Enforce free limits (5 debts, no AI, limited simulator/export)
	•	Remove BetaGate* components + isBeta checks

⸻

CP-1 — Data Layer Consolidation

Goal: Single source of truth via TypeScript IndexedDB store.
	•	Implement localDebtStore.ts with CRUD + meta table
	•	Write migrateLegacyData.ts to import localStorage → IDB
	•	Deprecate debtsManager.js (read-only, throws on write)
	•	Rewrite useDebts to delegate to IDB until CP-5 lands
	•	Add analytics + tests for migration

⸻

CP-2 — MyPlan Decomposition

Goal: Split MyPlan.jsx into focused components.
	•	Create DebtDashboard, TabNavigation, DebtManagement, ModalController
	•	Limit MyPlan.tsx to ≤200 LOC orchestration
	•	Snapshot tests + re-render perf checks

⸻

CP-3 — TypeScript Completion

Goal: Full typing for debts, utils, hooks, and components.
	•	Add types/debt.ts with shared interfaces
	•	Convert utils, hooks, components/debt/* to .ts/.tsx
	•	Enable strict TS config
	•	Lint/build guards for type safety

⸻

CP-4 — Milestones & Celebrations

(already defined in detail — leave reference here, point to design doc)

⸻

CP-5 — Hook Decomposition

Goal: Replace giant useDebts with small focused hooks.
	•	Create useDebtData, useDebtMutations, useDebtSync, usePlanStrategy, useDebtMilestones
	•	Write unit tests for each
	•	Mark useDebts deprecated umbrella

⸻

CP-6 — Utilities Consolidation & Forms Library

Goal: Kill duplication, centralise calculations + formatting.
	•	Create utils/debtCalculations.ts + utils/formatting.ts
	•	Build shared CurrencyInput, PercentInput, etc.
	•	Refactor DebtFormModal + DebtTableRow to use shared inputs
	•	Pure function + accessibility tests

⸻

📊 Future Enhancements
	•	Analytics funnel
	•	Stripe subscription portal
	•	AI quota display + tiering
	•	Accessibility audit

⸻

Last Updated: August 24, 2025