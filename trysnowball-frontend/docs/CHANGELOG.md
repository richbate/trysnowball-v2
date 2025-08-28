# Changelog

All notable changes to TrySnowball will be documented in this file.

## Unreleased

### Changed
- Migrate My Plan and Debts tab to IndexedDB (remove legacy localStorage sources)

## [2.3.0] - 2025-01-09

### Added
- **D1 Debt Synchronization System**: Comprehensive cloud sync implementation following TrySnowball Data Routing Plan
  - **Worker API Endpoints**: Full-replace PUT /api/debts with transactional safety, 200 debt user limit, comprehensive validation
  - **Client Sync Engine**: DebtSyncClient with 500ms debounced sync, offline handling, reconnection logic
  - **Smart Data Routing**: Anonymous users → localStorage only, Authenticated users → D1 authoritative with localStorage mirror
  - **Migration Logic**: hydrateFromServerOrMigrate() handles D1 empty + local data → migrate to D1, D1 has data → D1 wins  
  - **Offline Support**: syncNeeded flag, online/offline event handling, automatic sync on reconnection
  - **Observability**: Analytics events for migration (debts_migrated_to_d1), sync success/failure with metrics
- **Form System Overhaul**: Complete form component library eliminating styling inconsistencies
  - **CSS Theme Tokens**: Comprehensive :root + [data-theme="dark"] variables for consistent light/dark form styling
  - **FormField Component**: Unified wrapper handling labels, hints, errors, required states, spacing
  - **Form Primitives**: Input, Textarea, Select, Checkbox, Fieldset components with consistent theming
  - **Major Migrations**: DebtFormModal (6 inputs), UpdateBalanceModal, CommitmentGenerator, DebtPasteInput to new system
  - **Dark Mode Compatibility**: Full theme switching support via CSS custom properties

### Fixed  
- **Two Sources of Truth Issue**: Unified /plan and /my-plan to both use useSmartDebts() eliminating hydration disagreements
- **Button System Migration**: Replaced "Bootstrap 2.0 demo site" buttons with professional Button component across entire app
  - **Design System**: Clean variants (primary, secondary, muted, ghost, destructive, special) with consistent hover states
  - **Comprehensive Migration**: Updated 50+ components including navigation, pages, modals, forms with new Button system
  - **Accessibility**: Proper focus states, loading spinners, ARIA attributes throughout
- **Pricing Accessibility**: Removed login requirement to view pricing, moved Pricing to main navigation from buried dropdown

### Changed
- **Data Architecture Clarity**: Established clear routing statements per TrySnowball Data Routing Plan
  - Anonymous: localStorage only (no API calls)
  - Authenticated online: D1 authoritative, localStorage mirror, debounced sync  
  - Authenticated offline: localStorage + in-memory, syncNeeded flag for reconnect
  - Auth transitions: proper hydration without data loss
- **Navigation Restructuring**: Moved trust-building links (Security, How It Works, Strategies) to footer for cleaner conversion flow
- **Enhanced Button Polish**: Unified secondary variants, consistent button group alignment, standardized spacing from headings

### Technical Implementation
- **D1 Schema**: Debts table with user_id indexing, foreign key constraints, order management
- **Sync Pattern**: Full-replace PUT pattern maintaining D1 as single source of truth for authenticated users
- **Error Handling**: Comprehensive failure modes, network error recovery, large payload protection
- **Performance**: Debounced writes, efficient batch operations, optimized reconnection logic

---

## [2.2.0] - 2025-01-08

### Added
- **Comprehensive Documentation Set**: Created complete technical docs (AI_SYSTEM.md, SUBSCRIPTIONS.md, ANALYTICS.md, DATA_MODEL.md, TECH_ARCHITECTURE.md, OPERATIONS.md, CONTENT_STYLE_GUIDE.md)
- **Enhanced Analytics Tracking**: Added conversion funnel events for pricing/upgrade pages (`pricing_tier_clicked`, `upgrade_button_clicked`, `roi_calculator_viewed`)
- **Privacy Page**: Created comprehensive privacy policy with UK GDPR compliance
- **Founders ROI Calculator**: Added break-even calculator showing 16-month payback period
- **PostHog Dev User Exclusion**: Triple-layer protection preventing development data in analytics
- **UK Content Standards**: British English pricing format, terminology, and accessibility guidelines

### Changed
- **Pricing Page Redesign**: Updated to show correct Free/Pro/Founders tiers matching subscription documentation
- **Upgrade Page Improvements**: Removed "unlimited AI" claims, added realistic daily limits (5/50/100 chats)
- **AI System Upgrade**: Updated to v2.1 with tier-based usage limits and UK debt coach persona
- **SEO Optimization**: Updated sitemap.xml and robots.txt for better search visibility

### Fixed
- **Tier Structure Alignment**: Both pricing and upgrade pages now match SUBSCRIPTIONS.md exactly
- **Analytics Data Quality**: Enhanced PostHog exclusion prevents dev-user-123 events in production
- **Content Consistency**: Eliminated conflicting information between pricing pages and documentation

---

## [2.1.0] - 2025-01-08

### Added - Demo Mode with Gated Persistence

### Added - Demo Mode with Gated Persistence

**Complete Anonymous User Experience:**
- **useDemoDebts Hook**: Full debt management system using localStorage with realistic UK debt seed data
  - Pre-seeded with Credit Card (£1,200 @ 19.99%), Car Loan (£7,500 @ 4.9%), Personal Loan (£2,500 @ 7.5%)
  - Complete CRUD operations: add, edit, delete, reorder debts
  - All data stays client-side - never synced to backend
  - Maintains debt history and calculations in demo mode
- **useSmartDebts Routing Hook**: Automatically switches between demo and real debt systems based on authentication
  - Seamless transition from demo to authenticated mode
  - Compatible with existing components (drop-in replacement for useDataManager)
  - Mode detection and state management
- **DemoModeBanner Component**: Dismissible UI banner for anonymous users
  - "🎯 You're in Demo Mode. Explore freely — join the beta to save your plan"
  - Persistent across sessions with localStorage dismissal tracking
  - Direct CTA to beta signup modal

**Gated Persistence Strategy:**
- Anonymous users can fully explore debt management without signup barriers
- Only persistence actions (import, backend sync) require authentication
- All debt calculations, snowball strategy, charts work in demo mode
- Import functionality gates to beta signup modal

**Analytics & Conversion Tracking:**
- Comprehensive PostHog event tracking for demo interactions
- Events: demo_mode_initialized, demo_debt_added, demo_debt_updated, demo_debt_deleted
- Conversion funnel tracking from demo → modal → signup → first real debt
- Demo engagement metrics and user behavior analysis

**Technical Implementation:**
- Demo debts marked with `isDemo: true` and `demo-` ID prefixes
- Support for converting demo debts to real format on signup
- Demo data reset and seeding utilities
- Full backwards compatibility with existing debt management components

### Added - Enhanced Debt Calculation Module

**Major Refactoring:**
- **New Module**: `src/utils/simulateSnowball.js` - Enhanced JavaScript implementation
- **Improved Calculations**: 
  - Enhanced edge case handling (overpayment detection, immediate payoff)
  - Proper floating-point rounding to prevent calculation drift
  - Interest precision improvements with 2-decimal place rounding
  - Binary search optimization for target payment calculations
- **Better Error Handling**: Graceful failure modes and validation
- **Enhanced Functionality**: 
  - Immediate payoff detection when total payment >= total debt
  - Proper handling of zero-balance debts and cleared accounts
  - Improved mathematical accuracy for extreme scenarios
- **Mathematical Accuracy Fixes**: 
  - **Corrected Interest Application**: Interest now added before principal payment (fixes debt growth issue)
  - **Negative Payment Prevention**: Available payment cannot go below zero after minimums
  - **Realistic Binary Search**: Upper bound now uses total debt instead of arbitrary £2000
  - **Proper Payment Order**: Interest → Add interest → Apply minimum → Apply extra to smallest debt
- **Comprehensive Testing**: 13 test cases covering mathematical accuracy and extreme edge cases
- **Backwards Compatibility**: Maintains existing API for seamless integration
- **Performance**: Optimized calculation loops with early termination

### Added - My Debt Plan UI Improvements

**Enhanced Text & Layout:**
- **Header Area:** Upgraded to "My Debt Plan" with larger font and clear hierarchy, added subtitle "Your personalized repayment strategy and timeline"
- **Key Metrics Display:** Replaced inline text with 3 professional mini cards (🔴 Current Total Debt, 🟠 Minimum Payments, 🔵 Snowball Payment)
- **Extra Payment Section:** Enhanced slider UI with prominent pill-style value display, added contextual feedback "+£100 extra = Pay off 8 months sooner"
- **Budget Planner CTA:** Added 💡 emoji, improved benefit messaging "discover where you can save £50+ per month", action-driven language
- **Cut Debt Time in Half:** Converted to prominent callout card with gradient background, clearer messaging and improved button text
- **Overall Tone:** Friendly, action-driven language throughout with better visual hierarchy

### Added - AI Coach System

**Major Features:**

**1. /coach Page with GPT Embed**
- Embedded ChatGPT iframe with TrySnowball branding
- Supabase authentication gating
- Pro subscription requirement (configurable)
- Conversation starters and welcome messages
- AI report auto-copy for context management
- Analytics tracking for usage metrics
- User feedback system with modal

**2. /ai-report Page with Comprehensive Data Export**
- Structured debt analysis with natural language summaries
- Executive summary with key metrics
- Active debts in snowball order with utilization tracking
- Payment history analysis and consistency scoring
- Strategic recommendations based on user situation
- Credit utilization analysis
- Snowball projection with debt-free dates
- Copy functionality for formatted text and JSON
- Real-time report generation

**3. Enhanced Supabase Auth + Premium Gating**
- Updated UserContext to include isPro status
- Development mode auto-grants Pro access
- Production checks user_metadata for subscription status
- Authentication state management with Pro status
- Graceful fallback for non-authenticated users

**4. GPT Integration with Custom Prompts**
- Welcome message: "Hey there 👋 I'm your TrySnowball AI Coach..."
- 5 conversation starters:
  - Enter my debts and start a plan
  - What's the difference between snowball and avalanche?
  - How much interest am I really paying?
  - Show me a sample debt import file
  - How fast can I be debt-free?
- Configurable ChatGPT embed URL via environment variables

**5. AI Context Management**
- Automatic AI report generation with user debt data
- One-click copy-to-clipboard functionality
- Comprehensive report includes: active debts, cleared debts, payment history, snowball projections, and strategic recommendations
- Natural language summaries for easy AI consumption
- Session storage for conversation starter selection

**6. Analytics & Feedback System**
- Page visit tracking with user and debt metrics
- Chat session start tracking
- Report copy event tracking
- Positive/negative feedback collection
- Feedback modal for improvement suggestions
- Google Analytics integration points

**7. UI/UX Polish with TrySnowball Branding**
- Consistent color scheme and typography
- Responsive design for mobile/desktop
- Loading states and error handling
- Professional interface with clear CTAs
- Navigation integration in account dropdown
- Proper routing configuration with metadata

**Technical Implementation:**
- Two new React components: Coach.jsx and AIReport.jsx
- Enhanced UserContext with Pro status management
- Updated routing configuration with premium route metadata
- Environment variables for configuration (.env.example added)
- Comprehensive error handling and loading states
- Analytics integration ready for Google Analytics
- Mobile-responsive design throughout

**Environment Variables Added:**
- `REACT_APP_CHATGPT_EMBED_URL`: ChatGPT iframe URL
- `REACT_APP_REQUIRE_PRO`: Toggle Pro requirement
- Additional Supabase and analytics configuration

### Fixed
- Payment History tab loading issues on /debts page with defensive programming
- React hooks dependency warnings
- Missing function validation in payment components
- **Critical Math Bug**: Fixed extra payment slider showing impossible calculations (e.g., "+£1,100 extra = Pay off 101 months sooner")
  - Added proper baseline comparison logic to prevent time savings exceeding total payoff period
  - Implemented safeguards to cap maximum savings at baseline months minus 1
  - Enhanced calculation validation to handle edge cases and prevent mathematical impossibilities
- **Overpayment Edge Case**: Fixed scenarios where extra payment >= total debt
  - Now correctly shows "Pay off all debt in 1 month! 🎉" for overpayment scenarios
  - Added immediate payoff detection in simulateSnowball function
  - Prevents negative months or mathematical impossibilities
- **Interest Rounding**: Added 2-decimal place rounding to prevent floating-point drift
  - Applied to all scenarios: Do Nothing, Minimum Payments, and Snowball calculations
  - Formula: `Math.round(debt.balance * (debt.rate / 12 / 100) * 100) / 100`
  - Ensures calculations match real-world financial precision
- **Do Nothing Validation**: Added monitoring to ensure interest-only scenario never decreases
  - Console warnings if balance decreases (indicates calculation error)
  - Validates compound interest growth logic
- **Comprehensive Test Suite**: Created debtCalculationTests.js with 10 test groups
  - Edge case validation: overpayment, zero payment, insufficient payment
  - Mathematical consistency: higher payments = faster payoff
  - Snowball method accuracy: smallest debt targeted first
  - Interest calculation precision and floating-point drift prevention

### Changed
- Updated navigation to include AI Coach features in account dropdown
- Enhanced UserContext to support premium user status
- Routing configuration now includes premium feature metadata
- **Major UX Improvement**: Reordered WhatIfMachine page with results-first flow
  - **New Structure**: 1) Key Metrics → 2) Snowball Advantage → 3) Chart Comparison → 4) Payment Slider → 5) Budget Tools → 6) Detailed Breakdown
  - **Psychology**: Show motivating results first (savings + time reduction) before asking users to adjust sliders
  - **Enhanced Headings**: Added descriptive section titles with emojis (🎯 The Snowball Advantage, 📊 Compare Strategies, 🚀 Boost Your Snowball)
  - **Improved Hierarchy**: Larger text for key metrics, better visual separation between sections
  - **Context Flow**: Budget Planner and Half-Time callouts now follow the slider where users understand impact of extra payments

---

## Previous Changes

### [2025-01-25] - Chart Organization & Navigation Improvements
- Created organized /components/charts/ folder structure
- Added stepper navigation with user journey tracking
- Implemented routing configuration system
- Fixed Timeline flat line issue with correct debt data mapping
- Added cross-linking CTAs between debt management pages

### [2025-01-24] - App Structure Consolidation
- Consolidated navigation and removed duplicate routes
- Renamed /debts to "Manage Debts" and /my-plan to "My Progress"
- Deprecated /progress route completely
- Updated Timeline tab to "Your Forecast" vs What-If as "Try Scenarios"
- Added comprehensive routing metadata configuration