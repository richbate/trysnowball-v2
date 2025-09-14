---
**⚠️ LEGACY V1 REFERENCE DOCUMENT**
This document contains outdated information from the original TrySnowball frontend.
Configuration details may no longer be current.
For current implementation, see CP-series documentation.
---

# Claude Settings & Project Configuration (V1 Legacy)

Build & Test Commands
	•	Build: npm run build
	•	Start: npm start
	•	Test: npm test

Project Type
	•	React application using Create React App
	•	TailwindCSS for styling
	•	Recharts for data visualization

Key Dependencies
	•	React 18.2.0
	•	React Router DOM 7.6.3
	•	Recharts 3.0.2
	•	TailwindCSS 3.3.2

Project Structure

src/
├── components/
│   ├── EmailPrompt.js
│   └── ThemeToggle.js
├── pages/
│   ├── Home.jsx
│   ├── Library.jsx
│   ├── MyDebtsPage.js
│   ├── ThankYou.js
│   └── WhatIfMachine.js
├── lib/
│   └── supabase.js
├── App.js
└── index.js

Data Flow
	•	Demo Mode: Uses localStorage for client-side demo data
	•	Authenticated Users: Cloud storage with Cloudflare D1 + multi-device sync
	•	Smart routing between demo and cloud storage based on auth state

Development Notes
	•	Demo data stays client-side, real user data syncs to cloud
	•	Proper user isolation with server-side storage
	•	Mobile-responsive design
	•	Debt snowball method implementation

⸻

📱 iOS App Implementation (Claude’s Responsibility)

Tech Stack
	•	Framework: React Native with Expo
	•	Graphing: victory-native or recharts-lite
	•	Auth: Reuse magic link flow via Cloudflare Worker APIs
	•	State: React Query or Zustand
	•	Storage: AsyncStorage for token/session
	•	Sharing: Native Share API
	•	Notifications (stretch): Expo Push Notifications

Folder Structure (mobile)

trysnowball-mobile/
├── components/
│   ├── DebtCard.tsx
│   ├── TimelineChart.tsx
│   └── MilestoneCelebration.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useDebts.ts
│   └── useTimeline.ts
├── lib/
│   ├── api.ts
│   ├── share.ts
│   └── referral.ts
├── screens/
│   ├── HomeScreen.tsx
│   ├── DebtsScreen.tsx
│   ├── ProgressScreen.tsx
│   ├── MilestoneScreen.tsx
│   ├── ReferralScreen.tsx
│   └── SettingsScreen.tsx
├── theme/
│   ├── colors.ts
│   └── fonts.ts
├── App.tsx
├── navigation.tsx
└── app.config.ts

Mobile MVP Scope
	•	✅ Magic link login
	•	✅ View debts list (synced from cloud)
	•	✅ Add/edit debt
	•	✅ Inverted timeline graph (burn-up style)
	•	✅ Milestone detection + share
	•	✅ Referral screen with native link sharing
	•	🚧 Optional: Push notifications
	•	🚧 Optional: Homescreen widget (native bridge)

⸻

Current Session Todos

<!-- This section tracks ongoing work between sessions -->


	•	✅ Remove SpendAnalyser component and related files
	•	✅ Create Dave Ramsey’s 7 Baby Steps page
	•	✅ Update navigation to remove SpendAnalyser links
	•	✅ Update WhatIfMachine to handle manual savings input instead of SpendAnalyser data
	•	✅ Update CLAUDE.md with session context
	•	✅ Fixed critical runtime crashes (“reduce is not a function”, “Cannot read properties of undefined”)
	•	✅ Implemented CP-1 Data Layer Consolidation with IndexedDB migration
	•	✅ Added defensive programming with toDebtArray normalizer
	•	✅ Created no-op deprecation shims to prevent legacy storage crashes
	•	✅ Improved empty state UX after clearing demo data
	•	✅ Added comprehensive unit tests for crash prevention (14 tests passing)
	•	✅ iOS app scope and folder structure defined
	•	⏳ Claude to implement iOS app starting with auth + debts + timeline

⸻

Critical Fixes Applied

Runtime Stability
	•	toDebtArray() ensures array safety in debt operations
	•	Legacy crash protection via deprecation shims
	•	useDebts wrapped with safe guards
	•	UX polish on empty state views

Data Layer
	•	✅ CP‑1: IndexedDB migration complete with fallback and auto-upgrade
	•	Safe to toggle between demo and cloud modes

⸻

Session History
	•	2025-07-17 – Context reset, began persistent session tracking
	•	2025-07-17 – Removed SpendAnalyser, added Baby Steps, improved privacy UX
	•	2025-08-24 – Critical runtime and data layer fixes, added test coverage
	•	2025-08-30 – Scoped and launched TrySnowball mobile app initiative (Claude owner)
	•	2025-09-02 – Added Claude Code GitHub Actions for automated PR workflow

⸻

GitHub Actions Integration

Claude Code is available via GitHub Actions for:
	•	Automated PR creation from issues
	•	Code reviews on pull requests  
	•	Bug fixes and feature implementation
	•	Test generation and documentation

Trigger Claude by:
	•	Commenting @claude in issues/PRs
	•	Using /review for PR reviews
	•	See .github/claude-commands.md for all commands

⸻

🚨 CRITICAL BUGS

### [FIXED] D1 Sync Silent Failure – Missing Worker Deployment

**Date:** 2025-09-08  
**Owner:** richbate  
**Status:** ✅ Resolved  

#### 🧨 Root Cause
Cloudflare Workers for `/auth/*` and `/api/*` were not deployed to production. This caused 404s on all backend routes, breaking D1 sync while frontend appeared functional due to valid JWTs and local IndexedDB storage.

#### 🧪 Symptoms
- `GET /auth/login` and `GET /auth/user` returned 404
- `/api/debts` fetches failed silently
- Debt edits appeared to save, but vanished on refresh
- Zombie session system did not trigger (no 401s)

#### ✅ Resolution
- Deployed:
  - `trysnowball-auth-main-prod` → `/auth/*`
  - `trysnowball-debts-api-prod` → `/api/*`
- Verified health:
  - `/auth/health` → 200 OK
  - `/api/status` → 200 OK (11 debts)

#### 🔒 Confirmed Fixed
- Sync now persists after page reload
- D1 database reflects current state
- All API routes are online

#### 🔮 Future Improvements
- Add `ci/healthcheck.js` script before deploy
- Log `backend_unreachable` PostHog event on 404/5xx API calls
- Add banner if backend unreachable: "Offline Mode Only"

### [FIXED] UUID UPDATE Detection Causing Balance Loss

**Date:** 2025-09-08  
**Owner:** richbate  
**Status:** ✅ Resolved  

#### 🧨 Root Cause
UUID-based debt IDs weren't being recognized as existing debts, causing UPDATE operations to be treated as CREATE operations. This led to balance values being lost when editing debt names.

#### 🧪 Symptoms
- Editing debt names caused balances to reset to zero
- Duplicate POST requests instead of PUT for existing debts
- User feedback: "balances not preserved"

#### ✅ Resolution  
- Fixed UPDATE detection logic in `debtsGateway.ts:99`
- Changed from: `debt.id.startsWith('debt-17')`  
- To: `debt.id && (debt.id.startsWith('debt-17') || debt.id.includes('-'))`
- Now handles both legacy IDs and UUID formats

#### 🔒 Confirmed Fixed
- PUT request logged at 3:49:14 PM showing correct UPDATE detection
- Balance values preserved during name edits
- No more duplicate debt creation on edits

#### 📊 All CRUD Operations Now Perfect
- **CREATE**: ✅ New debts sync to D1
- **READ**: ✅ Debts load from D1 on refresh  
- **UPDATE**: ✅ Edits preserve values and sync correctly
- **DELETE**: ✅ Deletions remove from both local and D1

### [FIXED] Field Mismatch Causing Zero Values in Synced Debts

**Date:** 2025-09-08  
**Owner:** richbate  
**Status:** ✅ Resolved  

#### 🧨 Root Cause
Frontend-backend field mismatch caused debts to sync with zero values. Frontend sent legacy field names (`balance`, `minPayment`, `interestRate`) while backend expected canonical names (`amount_cents`, `min_payment_cents`, `apr_bps`).

#### 🧪 Symptoms
- Debts appeared to sync but showed £0.00 values
- "Recovered Debt" fallback names appearing
- Values persisted in D1 but with zeros due to field normalization failure

#### ✅ Resolution
- **Already Fixed** on 2025-09-06 with commit `88500b22`
- Added `safeDebtNormalizer.ts` with intelligent field conversion
- Frontend now sends canonical field names with `_norm_v: 2` marker
- Enhanced logging confirmed proper field mapping

#### 🔒 Confirmed Fixed
- Latest debt test: £1,234.00 → `123400` cents correctly synced
- Logs show proper field names: `amount_cents`, `min_payment_cents`, `apr_bps`
- All new debts sync with correct values

#### 📊 Impact Timeline
- **Before Sept 6:** Field mismatch caused zero values
- **Sept 6 onwards:** Perfect sync with correct values
- **Affected debts:** Only those created before Sept 6 have zero values

⸻

