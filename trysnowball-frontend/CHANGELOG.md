# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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