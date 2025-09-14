# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [2.5.0] - 2025-09-07

### 🚀 /plan Upgrade Release

#### Tab Structure Improvements
- **Renamed**: Review tab → Advanced tab
- **Route Updated**: `/plan/review` → `/plan/advanced`
- **New Tab Order**: Debts → Forecast → Strategy → Advanced

#### Advanced Tab (formerly Review)
- **Fixed Data Flow**: Advanced tab now receives debts + recordPayment props from Plan page
- **Shared Hook**: Uses `usePaymentPrefs()` hook for snowball/extra consistency across tabs
- **Minimum Payment Warnings**:
  - Amber banner displayed when minimum payments < monthly interest
  - "Min below interest" chips on affected debt rows
  - "Interest ≈ £X/mo" hints shown under insufficient minimum payments
- **Quick Actions**:
  - Switch to Snowball strategy instantly
  - Add £25 extra to budget with one click
- **New Help Content**: Linked to "Minimum Payments Explained" article
- **Toast Notifications**: Added for quick action feedback
- **Analytics Events**: `min_payment_insufficient_shown`, `interest_topup_clicked`, etc.

#### Forecast Tab Enhancements
- **Negative Amortization Detection**: Fixed £41M "hockey stick" bug
- **Diagnostics Display**: Shows when minimum payment ≤ monthly interest

#### Strategy Tab Updates
- **Burn-Up Charts**: Integrated target and portfolio visualization
- **Shared Preferences**: Via `usePaymentPrefs()` → snowball extra consistent across tabs

### 🔧 Core Fixes
- **Amortization Guardrails**: Ensures minimum payment ≥ interest + £0.01
- **New Debt Math Utilities** (`src/utils/debtMath.ts`):
  - `monthlyInterestCents()` - Calculate monthly interest in cents
  - `isNegativeAmortization()` - Detect when debt grows instead of shrinking
  - `shortfallCents()` - Calculate payment shortfall amount

### 📊 Data Flow Improvements
- All tabs receive data via Plan parent component → eliminates duplicate hook calls
- Example implementation:
  ```jsx
  <Route path="advanced" element={<ReviewPayments debts={displayDebts} recordPayment={recordPayment} />} />
  ```

### Removed
- Historical import UI (behind feature flag: IMPORT_HISTORY_ENABLED=false)
- Users must now add debts manually via "Add Debt" button

### Added
- Feature flag system (src/config/flags.js)
- FEATURE_FLAGS.md documentation

### Changed
- Tightened ESLint rules for unused variables
- Moved import components to src/compat/import/ for future re-enabling

## [2.4.0] - 2025-09-01

### 🎉 New Features

#### Historical Snapshot Importer
**You didn't start today** — Import your debt balance history to see your complete payoff journey

- **Import Past Balances**: Paste monthly balance history for any debt to track progress over time
- **Flexible Parser**: Accepts multiple date formats (June 2024, 06/2024, 2024-06-01) and currencies
- **Visual Preview**: See parsed data before importing with formatted dates and amounts  
- **Duplicate Prevention**: Automatically skips existing snapshots at the same timestamp
- **Full Integration**: Access via History icon (🕒) on each debt in My Plan → Debts tab

#### Action-Led Library Redesign
**From passive reading to active doing** — Library transformed into Action Hub

- **15 Action Cards**: Practical, trackable financial tasks across 5 categories
- **Progress Tracking**: Mark actions as done, save for later, see completion percentage
- **Smart Recommendations**: "Next Best Action" suggests highest-impact task
- **Category Filters**: Start, Cut Spending, Boost Motivation, Build Habits, Level Up
- **Feature Triggers**: Actions can open relevant app features (Snowflakes, Forecast, etc.)

### ✨ Improvements

#### Yuki Branding Standardized
- **Consistent Identity**: "🐈‍⬛ Meet Yuki — your AI debt coach" 
- **Japanese Meaning**: "Yuki means 'snow' in Japanese" shown in hero unit only
- **Cleaner Headers**: Simplified "Yuki 🐈‍⬛" in chat interface

### 🔧 Technical Updates
- **New Data Model**: `DebtSnapshot` type for historical balance tracking
- **IndexedDB Storage**: `snapshots` table with debtId, balance, timestamp fields
- **Bulk Import Method**: `bulkAddSnapshots()` with transaction safety
- **useLibraryProgress Hook**: Local storage persistence for action completion
- **PostHog Events**: New tracking for library actions and snapshot imports

### 📊 New Components
- `HistoryImporterModal.jsx` - UI for importing balance history
- `LibraryCard.jsx` - Action card display component
- `ActionArticle.jsx` - Full article view with step tracking
- `LibraryPage.jsx` - Main Action Hub with categories and search
- `parseHistoryTable.js` - CSV/TSV parser for balance data

### 🐛 Bug Fixes
- Fixed legacy `dataManager` references causing CI failures
- Replaced deprecated `/me` endpoint with `/auth/user`
- Corrected PostHog import capitalization (`usePostHog`)

## [2.3.0] - 2025-08-27

  ### 🚀 Major Features
  - **Complete Debt Strategy System**: Full implementation of Snowball (smallest balance first) and Avalanche (highest interest rate
  first) payoff methods with persistent user preferences
  - **Payment Schedule Matrix**: Month-by-month debt payment timeline table showing exactly how much goes to each debt every month
  - **Snowball Boosts Calculator**: Interactive scenarios for lifestyle changes (coffee savings, side hustles, windfalls) with
  real-time impact calculations

  ### 🔧 Critical Fixes
  - **Fixed Inverted Payment Math**: Resolved critical bug where fewer payments incorrectly showed faster payoff times
  - **Interest Savings Now Calculate**: Fixed calculations always showing "£0 interest saved" regardless of payment scenarios
  - **Progress Text Restored**: "🎉 Debt-free X months sooner" messaging now displays correctly with fallback logic

  ### 💫 UI/UX Improvements
  - **Strategy Switching**: Functional toggle between debt payoff methods with immediate visual feedback
  - **Collapsible Sections**: Better visual hierarchy with expandable "Try lifestyle boosts" scenarios
  - **Compact Payment Cards**: Inline boost meters with streamlined impact display
  - **Improved Navigation**: Reduced padding throughout for better text visibility on mobile
  - **Full Debt Lists**: Removed height restrictions that required scrolling in debt management

  ### 🏗️ Technical Enhancements
  - **Dual Timeline Calculators**: Separate `calculateSnowballTimeline` and `calculateAvalancheTimeline` functions for
  strategy-specific math
  - **Payment Matrix Builder**: Utility for transforming timeline data into tabular payment schedules
  - **Strategy-Aware Components**: All debt visualizations now respond to selected payoff method
  - **Performance Optimizations**: Memoized calculations prevent unnecessary recalculations during user interactions

  ### 📊 New Components
  - `DebtPaymentMatrix.jsx` - Month-by-month payment schedule table
  - `ScenariosPanel.jsx` - Interactive lifestyle boost scenarios
  - `SnowballBoostMeter.jsx` - Visual payment impact indicators
  - `SnowballPaymentsBar.jsx` - Payment allocation visualization

  ### 🔨 Developer Experience
  - Added comprehensive TypeScript types for scenario calculations
  - Enhanced debt timeline calculator with strategy-specific sorting
  - Improved localStorage persistence for user strategy preferences
  - Better error handling in payment simulation logic
  
## [2.2.0] - 2025-08-24

### Changed
- **Architecture Hardening**: Complete Phase 3 "Finalise & Harden" implementation
  - `debtsManager.js` transformed to pure facade pattern - delegates all operations to `localDebtStore.ts`, maintains no local state
  - Removed all legacy storage imports and localStorage fallbacks from core data layer
  - Beta gating system retired - now uses simple Free vs Pro model
  - `/upgrade` and `/account/upgrade` routes now use modern `Upgrade.jsx` component
  - Added production guard to `localDebtManager.ts` preventing misuse in production builds

### Added
- **E2E Smoke Tests**: Comprehensive test coverage for critical user flows
  - Debts tab full lifecycle: demo load → reorder → edit → history → clear → empty state → reload
  - Upgrade page visibility and routing validation
  - Empty state CTA verification
  - Rapid navigation stability testing
- **CI No-Legacy Checker**: `npm run check:no-legacy` script to prevent architectural regression
  - Detects forbidden patterns: `trysnowball-user-data`, `Storage.save`, `betaEnabled`, `UpgradeLifetime`
  - Provides clear error messages with remediation guidance
- **Pre-commit Hook Improvements**: Updated to use `lint-staged` with related tests only

### Removed
- Removed 4 legacy files totaling 3,013 lines of dead code:
  - `src/pages/MyPlan.jsx` (unused duplicate)
  - `src/pages/MyPlan.jsx.backup`
  - `src/hooks/useLocalDebts.ts`
  - `src/hooks/useCloudDebts.js`

### Fixed
- **£18,512 Ghost Elimination**: Complete removal of legacy localStorage debt totals
  - Deleted orphaned code block (lines 640-850) causing build errors
  - Fixed DebtsTab to use IndexedDB only (planTotalsDebts, planLoading)
  - Rewrote DebtsTab.jsx with no demo fallbacks  
  - Fixed MyPlan header tagline loading states
  - Added proper component imports for DebtsTab

### Added
- **Test Infrastructure**: Complete testing setup for CI readiness
  - Added setupTests.js with polyfills (structuredClone, crypto.randomUUID, matchMedia)
  - Added testUtils.jsx renderWithProviders wrapper (ThemeProvider + BetaGate + UserContext + Router)
  - Added integration tests for MyPlan totals verification
  - Fixed ESLint conditional expect errors in tests

### Technical
- IndexedDB is now single source of truth for debt totals
- localStorage shadow guards prevent legacy data leaks
- Build passes with no syntax errors
- All tests pass and ready for CI integration