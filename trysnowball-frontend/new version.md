# TrySnowball Rebuild Strategy

## Immediate Action: Static Holding Page

**Problem**: Current app has deployment issues. Need zero-downtime solution to collect waitlist emails while rebuilding.

**Solution**: Deploy minimal static holding page to separate repository, then rebuild main app according to architecture below.

### Holding Page Implementation
```
trysnowball-static/
├── index.html              # Static holding page with email form
├── functions/
│   └── api/waitlist.js     # Cloudflare Function for email collection  
├── _headers                # CSP configuration
└── README.md              # Deployment instructions
```

**Deployment Steps:**
1. Create `trysnowball-static` repository
2. Build static page with Tailwind CSS (via CDN)
3. Deploy to Cloudflare Pages (same domain)
4. Configure D1 waitlist table + Worker endpoint
5. Test email collection + spam protection
6. Rebuild main app per architecture below

---

## Long-term Architecture Plan

Good call. Clean slate, small surface area, zero surprises. Here's a lean, requirements-first plan to rebuild TrySnowball without the bloat.

⸻

Guiding principles (apply to everything)
	•	Local‑first UX, one source of truth. Anonymous = localStorage only. Authed = D1 authoritative with a local mirror. No split-brain; full‑replace sync to server.  ￼
	•	Tiny backend, cheap to run. Cloudflare Pages + 1 Worker namespace + D1. No extra services unless they pay for themselves in retention or conversion.
	•	Deterministic math engine. One module + one test suite. No duplicate calculators.  ￼
	•	Centralized gating & analytics. One hook to gate features; CSP guardrails so analytics never “accidentally” die again.  ￼  ￼

⸻

A) Data management (product & technical requirements)

Data model (MVP)
	•	Debt: id, user_id, name, balance_pennies, apr_bips, min_pmt_pennies, order, created_at, updated_at.
	•	DebtHistory (append‑only): id, debt_id, timestamp, type, prev_balance_pennies, new_balance_pennies, change_pennies, source, note. Keep last 50 entries per debt; older pruned. Storage impact ~4KB/debt @ 50 entries.  ￼  ￼
	•	UserSettings (optional later): currency, locale, flags.

Storage & sync rules
	•	Anonymous users: strictly localStorage; no network calls.
	•	Authed users: D1 is authoritative; client keeps a local mirror for offline; on reconnect, full‑replace PUT /api/debts (debounced 500ms) with transactional write. On conflict, server wins. Cap: max 200 debts per user. Emit analytics for migrate/success/failure.  ￼
	•	Offline mode: syncNeeded flag, auto‑sync on reconnect; no silent drops.  ￼

API (Workers)
	•	GET /api/debts → returns current canonical set + latest history summaries.
	•	PUT /api/debts (full‑replace): validates schema, applies in one tx, re‑orders order 1..n, enforces caps. Returns canonical set.  ￼
	•	POST /api/debts/:id/history (optional, phase 2) to push a single balance update with typed source.  ￼

Client state
	•	One hook: useDebts() providing: debts, saveDebts(fullSet), updateDebt(patch), reorder(ids), getHistory(id). Internally handles debounce + offline + migration (D1 empty + local → migrate; else D1 wins).  ￼
	•	History write occurs only when balance changes; enrich entry with source (balance_update_modal, payment_tracker, etc.).  ￼

Validation & limits
	•	Hard input guards on APR (0–79.99%), balance (0–£250k), min payment (≥£1), debts/user (≤200). Server validates again (don’t trust client).  ￼

Observability & analytics (minimal)
	•	Track: debts_migrated_to_d1, sync_success, sync_failed, debts_updated. Keep CSP safe list in repo + precommit/build checks so GA/GTM never break.  ￼  ￼

Acceptance
	1.	Kill network on an authed session → edits queue → reconnect → server matches client exactly. 2) CSP validation blocks a deploy that would break GA/GTM.  ￼

⸻

B) AI coach (one page, one endpoint, tight cost guardrails)

Scope
	•	One chat surface “AI Coach” with streamed answers.
	•	No history retention server‑side. No uploads. Context = current debts + roll‑up metrics only.  ￼

Backend (Workers)
	•	POST /ai/chat → {prompt} + compact context (debts array with name, balance, apr, min, totals, min sum).
	•	Apply tiered rate limits (free: low; pro: higher). Hard token ceiling per call + per‑day cap. Fallback message when exceeded.  ￼
	•	Safety: mild guardrails; refuse out‑of‑scope finance/legal claims; no PII logging. “Zero data retention” requirement.  ￼

Prompting & outputs
	•	System prompt: concise UK debt coach persona; stick to snowball/avalanche basics; cite app flows; ask for missing fields briefly; never invent numbers.
	•	Cost controls: temperature low, model capped tokens, truncate context (e.g., top 10 debts + totals). Track token usage per user.

Client
	•	Hook useGPTAgent(mode='coach') with circuit‑breaker & exponential backoff; shows fallback copy if API blocked.  ￼

Dev tooling
	•	Keep analyzePayments(amountA, amountB) as a dev console helper to compare timelines, not a user feature; helps prove math changes the dates.  ￼

Acceptance
	1.	With no debts, coach asks for them. 2) With debts, coach references current totals & min payments correctly. 3) Caps actually stop requests after N/day and show a polite fallback.  ￼

⸻

C) Debt tracking in D1 (schema, engine, timelines)

D1 schema (SQLite)

-- debts
CREATE TABLE debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  balance_pennies INTEGER NOT NULL,
  apr_bips INTEGER NOT NULL,
  min_pmt_pennies INTEGER NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_debts_user ON debts(user_id);

-- debt_history (append-only, capped client-side at 50)
CREATE TABLE debt_history (
  id TEXT PRIMARY KEY,
  debt_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL, -- created, balance_update, payment_recorded
  prev_balance_pennies INTEGER,
  new_balance_pennies INTEGER,
  change_pennies INTEGER,
  source TEXT,
  note TEXT
);
CREATE INDEX idx_hist_debt ON debt_history(debt_id, timestamp DESC);

(Modeled from prior change‑log spec & history design.)  ￼  ￼

Calculation engine
	•	One module DebtEngine with:
computeTimeline(debts, totalPayment), monthsToFreedom, interestTotals, requiredExtraForTargetMonths.
	•	Rules: minimums first, apply extra to smallest balance; interest monthly = balance * (APR/12). Edge cases: overpayment → immediate payoff; precision rounding; binary search for target payment. Single test suite (≥25 tests).  ￼  ￼
	•	Known guardrails: cap “months saved” to baseline−1; avoid FP drift; stop at ≤£0.01.  ￼

UI (MVP)
	•	One page “My Debts”: table + “Update balances” modal (writes 1 history entry/debt if changed), simple payoff card (months, date), and 1 chart (line). No multi‑chart zoo.  ￼

Acceptance
	1.	Raising extra payment reduces months (unit tests prove it). 2) Bulk update writes batch history entries; latest 50 visible/exportable.  ￼

⸻

D) Library articles (static, SEO-safe, measurable)

Content model
	•	Markdown files in repo with front‑matter: title, slug, description, updated, tags. Build‑time generation to static routes /library/<slug>. Track view events.  ￼

SEO & plumbing
	•	Generate sitemap.xml + robots.txt at build; per‑article meta tags. (You’ve done this before—keep it.)  ￼
	•	CSP must continue to whitelist GA/GTM; we keep the validate‑csp script in precommit + prebuild so articles can’t silently nuke analytics.  ￼

Acceptance
	1.	New .md shows at /library/slug with correct <title>/<meta>. 2) Article views fire analytics events reliably.

⸻

E) Other core areas we must spec (small but boring)

Auth & sessions
	•	Magic link auth via Worker + D1 user table + SendGrid. Endpoints: /auth/request-link, /auth/verify, /api/user, /auth/logout. JWT in httpOnly cookie; Authorization optional for APIs. (Keep as you had it, but minimal.)
	•	isPro comes from user record (or feature flag) and is consumed only through one hook: usePremiumGate(). No scattered checks.  ￼

Gating & plans
	•	Tiers: Free (cloud save), Pro (AI coach, advanced charts), Founders (Pro features, lifetime flag). Centralized gate + environment override for dev. Pages must not have conflicting gates.  ￼

Analytics & CSP
	•	Providers: GA4 + (optionally) PostHog. Single useAnalytics() with track(name, props).
	•	CSP: keep GTM/GA domains whitelisted; ship scripts/validate-csp.js + .husky/pre-commit + "prebuild": "npm run validate-csp". This prevents the July‑style outage.  ￼

Performance targets
	•	Initial JS ≤250KB gzipped; route‑level lazy‑loading; charts only where needed. (Prior refactor hit ~246KB—use that as guardrail.)  ￼

Testing
	•	Unit: DebtEngine (edge cases + determinism).  ￼  ￼
	•	Integration: PUT /api/debts happy path + caps + bad payload.
	•	E2E smoke: create debt → update balance → see timeline change → refresh → state persists.

Deployment
	•	One Cloudflare Pages project; one Worker (API routes), one D1 database. Migrations checked into repo. Rollbacks are table‑safe because client uses full‑replace PUT.

Dev ergonomics
	•	A single debug console helper (non‑prod): window.analyzePayments(a, b) to instantly prove timelines differ. It never ships to prod bundles.  ￼

⸻

Non‑goals (for v1)
	•	Bank connections, push notifications, mobile app, community features, complex visualizations, CMS. Keep it boring and shippable.

⸻

Cut‑down navigation (v1)
	1.	My Debts (default)
	2.	AI Coach (Pro‑gated)
	3.	Library
	4.	Account

⸻

If you want, I’ll turn this into a one‑page Architecture Decision Record + a checklist we can pin to the repo. But this is the spine. We keep scope tight, math correct, sync simple, and costs predictable.