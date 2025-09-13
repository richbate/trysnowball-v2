# Documentation Index

## Canonical CP-Series
- CP-2_FORECAST_ENGINE_V1.md (Deprecated - Free tier fallback)
- CP-3_ANALYTICS_PRIVACY.md
- CP-3_FOUNDATION.md  
- CP-4_ANALYTICS_SUITE.md
- CP-4_FORECAST_ENGINE_V1.md
- CP-4_FORECAST_ENGINE_V2.md
- CP-4_LIMITATIONS.md
- CP-4_USER_FLOWS.md
- CP-5_ANALYTICS_SUITE.md
- CP-5_BLOCKING_CHECKLIST.md
- CP-5_GOALS_ENGINE.md
- CP-5_LIMITATIONS.md
- CP-5_USER_FLOWS.md
- CP-5.1_CHALLENGE_GENERATOR.md

## Canonical Specs (Non-CP)
- DEBT_SIM_MODEL.md — Core simulation math, edge cases
- FORECAST_ENGINE_V2.md — Full CP-4 implementation spec
- WAYS_OF_WORKING.md — Contribution and testing discipline
- DATA_FLOW.md — System data architecture
- ENTITLEMENTS.md — Free vs Pro tier definitions

## Operational References
- _ops/CLEANUP_PLAYBOOK.md — Tactical cleanup procedure

## Audits & Historical
- _audit/DASHBOARD_AUDIT.md — One-time UI audit

## Contribution Policy
- README.md — Documentation rules and structure
- INDEX.md — This file (source of truth for doc locations)

---

## UI Implementation Status

### CP-2 (Deprecated Single-APR Engine)
**Status:** ✅ Complete (fallback only)
- Basic debt payoff simulation
- Single APR per debt
- Snowball/Avalanche strategies
- Monthly breakdown calculations

### CP-3 (Analytics & Privacy)
**Status:** ✅ Complete (privacy-safe implementation)
- Privacy-safe analytics events
- User action tracking (mocked for demo)
- Debug analytics display
- Event classification system

### CP-4 (Multi-APR Composite Engine)
**Status:** ✅ 100% Complete (12/12 golden tests passing)

#### ✅ Working Features:
- **Core Simulation**: Multi-bucket debt processing with Priority Waterfall algorithm
- **Forecast Table**: Month-by-month payoff breakdown with debt progression
- **Interactive Controls**: Real-time extra payment slider (£0-£1000 with notches)
- **Bucket Milestones**: Visual progress tracking for multi-APR debts
- **SVG Line Graphs**: Debt freedom comparison (minimum payments vs snowball)
- **Interest Breakdown**: Detailed interest calculations per debt/bucket
- **CP-4 Debug Panel**: Month-by-month calculation inspection
- **Composite Warning Banner**: Development limitations notice
- **UK Currency Formatting**: Proper £GBP display throughout

#### ✅ All Features Working:
- **Edge Cases Resolved**: All complex scenarios now passing
- **Overpayment Handling**: Bucket overflow logic working correctly  
- **Multi-debt Timing**: Snowball timing precision issues resolved
- **Rounding Precision**: All monetary values properly rounded to 2 decimal places
- **Debt Payoff Detection**: Proper tolerance handling for floating-point precision

### CP-5 (Goals & Challenges Engine)
**Status:** ✅ UI COMPLETE (Glassmorphism Dashboard + Library Module)

#### ✅ Working UI Features:
- **Glassmorphism Goals Dashboard**: Purple gradient theme with backdrop-blur effects
- **GoalTrackerCard Components**: Real-time progress tracking with CP-4 data integration
- **ChallengeTile Components**: Smart challenge suggestions with accept/dismiss actions
- **AddGoalModal**: Goal creation interface with tier validation
- **Tier Enforcement**: Free users (3 goals max) vs Pro users (unlimited) with blur effects
- **Challenge Generation**: Data-driven challenge creation from forecast analysis
- **Library Learning Hub**: Educational content with affiliate monetization
- **Tab Navigation**: Integrated into main app navigation with Goals & Library tabs

#### ✅ Data Integration:
- **Live Goal Tracking**: Connected to CP-4 forecast results via useGoals hook
- **Real Progress Calculation**: goalProgressForUser integration with composite simulator
- **User Tier Management**: useUserTier hook integration with isPro() logic
- **Challenge Analytics**: Ready for PostHog event tracking
- **Smart Challenge Generator**: generateSmartChallenges using forecast analysis

#### 🎨 Design System:
- **Glassmorphism Theme**: `bg-white/10 backdrop-blur-md border border-white/20`
- **Purple Gradients**: `bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900`
- **Responsive Layout**: Grid systems with mobile-first design
- **Tier Visual Cues**: Blur overlays and upgrade CTAs for free users

### CP-5.1 (Advanced Challenge Generator)
**Status:** ❌ Not Started
- Smart challenge recommendations
- Behavioral analysis
- Achievement psychology
- Progressive difficulty scaling

---

## Debug & Testing Environment

### DebugShowcase Component
**Status:** ✅ Production Ready
- **6 Test Profiles**: UK-focused debt scenarios (no mortgages/student loans)
- **Profile Switching**: Instant data replacement with session-only persistence
- **Interactive Slider**: Real-time snowball amount adjustment
- **Live Graph Updates**: SVG debt freedom visualization with "DEBT FREE!" markers
- **Month-by-Month Inspection**: CP-4 calculation debugging with bucket details
- **UK Financial Context**: Proper bank names (Halifax, Barclaycard, HSBC, etc.)
- **Realistic Scenarios**: £427 to £48,600 debt ranges for meaningful testing

## Status Notes

### Deprecated Documentation
- **CP-2_FORECAST_ENGINE_V1.md**: Marked as deprecated. Single-APR engine maintained as Free tier fallback only. All new development should use CP-4 multi-APR composite engine.

### Implementation Status
- ✅ CP-2: Complete (deprecated but functional)
- ✅ CP-3: Complete (privacy-safe analytics)
- ✅ CP-4: **COMPLETE** - All 12 golden tests passing, production-ready engine
- ✅ CP-5: **UI COMPLETE** - Glassmorphism Goals Dashboard & Library Module implemented
- ⏳ CP-5.1: Waiting for CP-5 production deployment

### Archive Policy
- Deprecated specs remain in main docs for reference but are clearly marked
- One-time audits and tactical playbooks are quarantined in subdirectories
- All live, canonical specifications remain at /docs/ root level