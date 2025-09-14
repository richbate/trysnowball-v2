TrySnowball — Architecture Now (Aug 2025)

Status: Post CP‑1 consolidation + Phase 3 hardening (facade, beta retirement, prod guards, E2E smokes).

⸻

1) High‑Level Overview

Goal: One clear data path, two account states (Free/Pro), dev tools quarantined.

[UI Pages / Components]
      │
      ▼
[Hooks]  ── useDebts() ────────────────┐
      │                                 │
      ▼                                 │
[Facade] ─ debtsManager (pure) ─────────┤   ← no local state, no legacy storage
      │                                 │
      ▼                                 │
[Store] ─ localDebtStore (Dexie/IDB) ───┘   ← single source of truth
      │
      ├── demoDebts.generate(locale)   ← single demo source (uk/default)
      └── meta (timestamps, etc.)

[Auth/JWT] ─ isPro flag → gating
[Analytics] PostHog events on key flows
[Dev‑only tools] localDebtManager (guarded)

Account States:
	•	Free: core features; soft limits (e.g., debts count, AI calls) enforced in UI/logic.
	•	Pro: full access; no beta flags anywhere.

⸻

2) Request/Render Lifecycle (Debts)
	1.	Page /my-plan/debts mounts.
	2.	Hook useDebts() calls debtsManager.list().
	3.	Facade delegates to localDebtStore.listDebts() (async, Dexie).
	4.	Normalizer toDebtArray() guarantees Debt[] to UI.
	5.	UI renders DebtSummaryCards, DebtTable, empty state if count === 0.

Mutations: add/update/delete/reorder
	•	UI → useDebts() → debtsManager.saveData() → localDebtStore.upsertMany().
	•	Hook recomputes metrics with safeNumber() guards.

Demo lifecycle:
	•	Try Demo: debtsManager.loadDemoData('uk') → localDebtStore.clearAll() + upsertMany(demo).
	•	Clear Demo: localDebtStore.clearAll() → hook sets [] immediately → empty state.

⸻

3) Modules & Responsibilities

UI
	•	Pages: MyPlan/*, Library, Upgrade.
	•	Debts: DebtSummaryCards, DebtTable, DebtHistoryViewer, DebtFormModal, NoDebtsState.
	•	Home: content‑forward (featured guides, search, quick tools).

Hooks
	•	useDebts — the only debts hook used by pages.
	•	Fetches/updates via facade; memoized metrics; robust error handling.

Facade
	•	debtsManager (pure)
	•	Exposes: list, saveData, clearAll, loadDemoData(locale), getMetrics, getDebtsWithLatestChanges.
	•	No local storage, no in‑memory caches, no legacy keys.

Store
	•	localDebtStore (Dexie/IndexedDB, TS)
	•	upsertMany, listDebts, clearAll, metaSet, loadDemoData(locale).
	•	Single demo source via demoDebts.generate().

Dev‑only
	•	localDebtManager guarded to throw in production if imported.
	•	Tools: StorageDoctor, Seed buttons, LocalTest page.

Auth & Gating
	•	Cloudflare Worker/JWT sets isPro: boolean.
	•	UI gates check only isPro (no beta/flags).
	•	Upgrade routes: /upgrade, /account/upgrade → Upgrade.jsx (Stripe/Lifetime as configured).

Analytics
	•	Key events: demo_loaded, demo_cleared, no_debts_state_shown, debt_added/updated/deleted, reorder_debts, history_opened, upgrade_viewed/started/completed.

⸻

4) Data Shapes & Contracts

// types/debt.ts
export type Debt = {
  id: string;
  name: string;
  balance: number;        // current outstanding
  minPayment: number;
  interestRate: number;   // APR %
  order: number;          // display/priority order
  createdAt?: string;
  updatedAt?: string;
};

Normalization:
	•	toDebtArray(any) → Debt[] accepts arrays, maps, {items: []}, null/undefined.
	•	All metrics use safeNumber() to avoid NaN.

⸻

5) Invariants (must stay true)
	•	One data source: All reads/writes go through localDebtStore.
	•	Pure facade: debtsManager has no local state, no legacy storage, only delegates.
	•	Arrays only: UI/hook/manager exchange Debt[] exclusively.
	•	Single demo source: demoDebts.generate(locale); no stray demo arrays.
	•	No beta: codebase contains no betaEnabled/isBeta/UpgradeLifetime.
	•	Dev quarantine: importing localDebtManager in prod is impossible (guarded).

⸻

6) Testing & CI Guardrails

Unit:
	•	toDebtArray, getMetrics, demoDebts consistency, facade→store integration.

E2E smoke:
	•	Debts lifecycle: demo → reorder → edit → history → clear → empty → demo.
	•	Upgrade visibility: Free vs Pro.

CI “No‑Legacy” Check:
	•	Script fails on: trysnowball-user-data, Storage.save, localDebtManager, betaEnabled, UpgradeLifetime.

Pre‑commit:
	•	lint-staged with eslint --fix and jest --findRelatedTests.

⸻

7) Diagrams

Component/Data Flow

UI (MyPlan/Library/Upgrade)
  │
  └─ useDebts() ───────────────▶ debtsManager (facade) ─────────────▶ localDebtStore (Dexie/IDB)
                                    │                                       │
                                    ├─ getMetrics(normalized)               ├─ demoDebts.generate(locale)
                                    └─ returns Debt[] + metrics             └─ meta (timestamps)

Demo Lifecycle (Sequence)

User → Try Demo
  → useDebts.loadDemoData('uk')
    → debtsManager.loadDemoData('uk')
      → localDebtStore.clearAll()
      → localDebtStore.upsertMany(demo)
  ← UI receives Debt[] → renders table/cards

User → Clear Demo
  → useDebts.clearDemoData()
    → localDebtStore.clearAll()
  ← UI sets debts=[] immediately → Empty state


⸻

8) Roadmap hooks (optional next steps)
	•	Router v7 future flags to silence warnings when convenient.
	•	Redux (if chosen): keep as UI state; do not mirror store data in Redux—select from useDebts() or add thin selectors that call the facade.
	•	Design tokens: if dynamic classnames are needed, safelist in Tailwind; prefer static classes in critical pages.

⸻

9) Glossary
	•	Facade: Narrow API layer delegating all IO to the store.
	•	Store: Dexie/IndexedDB persistence with typed operations.
	•	Normalizer: Utility that ensures stable Debt[] for all consumers.
	•	Dev‑only: Modules/tools compiled out or guarded from production.

⸻

This document is the canonical “now” picture. If you change any of the invariants (e.g., add cloud sync), update this file first, then implement.

⸻

10) Performance & Tooling Targets (added)
	•	Bundle budget: Keep main JS bundle < 400 KB gzip (current ≈ 375 KB). Use code‑splitting for heavy routes and avoid new deps unless they repay the cost.
	•	Pre‑commit: Uses lint‑staged to run ESLint fixes and jest --findRelatedTests only on changed files for speed.
	•	Router v7: Current v6 “future” warnings are cosmetic; migrate/enable flags when upgrading routing. No functional blockers.

⸻

