# 🛑 CP-5 Blocking PR Checklist — Goals & Challenges Layer

**Status**: BLOCKING | **Version**: v1.0 | **Merge Policy**: ALL ITEMS REQUIRED

This PR must not be merged until **all items are complete, tested, documented, and verified**.  
Goal: Deliver a bulletproof Goals & Challenges engine with schema accuracy, entitlement discipline, golden test coverage, analytics integrity, and full documentation alignment.

---

## 📋 1. Schema & Validation
- [ ] `Goal` interface implemented exactly as defined in CP-5_GOALS_ENGINE.md
- [ ] ENUMs (`GoalType`, `GoalStatus`) locked and type-checked
- [ ] Validation rules enforced:
  - `target_value > 0`
  - `target_date > start_date`
  - Only one active `DEBT_CLEAR` goal per debt/bucket
  - Status transitions limited to `ACTIVE → [ACHIEVED | FAILED | CANCELLED]`
- [ ] Entitlement checks (`goals.max_active`, `goals.allowed_types`) enforced before creation

---

## 🧪 2. Golden Test Scenarios
- [ ] All 9 golden scenarios from `cp5-goals.fixtures.json` implemented and passing:
  - Debt Clear Goal — success + failure
  - Amount Paid Goal — progression + achievement
  - Interest Saved Goal
  - Timebound Goal
  - Goal Cancellation
  - Goal Editing
  - Challenge Assignment
  - Entitlement Blocks (max_active + allowed_types)
- [ ] Tests validate:
  - State transitions
  - Analytics payloads (exact match, no fuzzy)
  - Currency rounding (2dp), APR rounding (1dp)
  - ENUMs from locked vocabulary
  - Required fields: `user_id`, `forecast_version`
- [ ] Fixture coverage test ensures no scenario silently dropped

---

## 📊 3. Analytics Events
- [ ] All 7 events implemented exactly as defined in CP-5_ANALYTICS_SUITE.md:
  - `goal_created`
  - `goal_updated`
  - `goal_progressed`
  - `goal_achieved`
  - `goal_failed`
  - `challenge_assigned`
  - `entitlement_blocked`
- [ ] Payloads match schema:
  - `user_id`, `goal_id`, `goal_type`, `forecast_version` required
  - Currency rounded to 2dp, APR to 1dp
  - ENUMs enforced, no free-text
- [ ] PostHog dev project verification complete:
  - Each event visible with correct payloads
  - Error codes ENUMed (`ENTITLEMENT_LIMIT_EXCEEDED`, `INVALID_DATE_RANGE`, etc.)
- [ ] Volume controls in place:
  - `goal_progressed` batched, no spam
  - Deduplication of repeated events

---

## ⚙️ 4. Entitlement Model
- [ ] `Entitlement` interface implemented exactly as defined in ENTITLEMENTS.md
- [ ] Default config loaded (Free vs Pro split):
  - Free: `max_active = 1`, `allowed_types = ["DEBT_CLEAR"]`
  - Pro: `max_active = 10`, `allowed_types = ["DEBT_CLEAR","AMOUNT_PAID","INTEREST_SAVED","TIMEBOUND"]`
- [ ] `entitlement_blocked` event fires on violation
- [ ] Unit tests in `ENTITLEMENTS.test.ts` confirm config matches fixture expectations
- [ ] Any entitlement drift fails tests automatically

---

## 🎯 5. User Flows & UI Integration
- [ ] Flows in CP-5_USER_FLOWS.md implemented:
  - Goal Creation
  - Progress Tracking
  - Goal Achievement
  - Entitlement Block & Upgrade
- [ ] **Cancellation Flow** added:
  - User cancels goal → status `CANCELLED`
  - Fires `goal_updated`
  - Goal archived in UI
- [ ] **Editing Flow** added:
  - User edits goal → target updated
  - Fires `goal_updated`
  - UI shows new target
- [ ] **Challenge Assignment Flow** added:
  - System suggests challenge → user accepts/rejects
  - Fires `challenge_assigned`
- [ ] UI Components implemented:
  - GoalsPage, GoalCard, EntitlementGate
  - GoalCard supports ACTIVE, ACHIEVED, FAILED, CANCELLED
  - UpgradePrompt shown on entitlement block
- [ ] Analytics events fire correctly during all UI flows

---

## 🧪 6. End-to-End Tests (Staging Verification)
- [ ] Cypress (or equivalent) tests cover:
  - Create goal → GoalCard visible → `goal_created` event fires
  - Progress goal → `goal_progressed` fires with updated value
  - Cancel goal → status = CANCELLED → `goal_updated` event
  - Edit goal → target updated → `goal_updated` event
  - Challenge assigned → GoalCard created → `challenge_assigned` event
  - Free user blocked → `entitlement_blocked` event + upgrade prompt
- [ ] Tests run in staging with real PostHog dev connection
- [ ] Screenshots/logs attached to PR for reviewer validation

---

## 📚 7. Documentation Updates Required
- [ ] **CP-5_GOALS_ENGINE.md** updated with:
  - Goal cancellation and editing flows
  - Challenge assignment golden test scenario
  - Integration points for cancellation/editing
- [ ] **CP-5_ANALYTICS_SUITE.md** updated with:
  - All 7 events with schemas, ENUMs, JSON examples
  - Error ENUMs documented (`ENTITLEMENT_LIMIT_EXCEEDED`, `INVALID_DATE_RANGE`)
  - Volume control specifications
- [ ] **ENTITLEMENTS.md** updated with:
  - Default config examples (Free vs Pro)
  - Example override config for A/B testing
  - Integration code examples
- [ ] **CP-5_LIMITATIONS.md** updated with:
  - v1.0 constraints: No editing history, no goal chaining
  - Forecast dependency risks clearly stated
  - User messaging requirements
- [ ] **CP-5_USER_FLOWS.md** updated with:
  - Cancellation, editing, and challenge flows
  - Analytics events aligned with engine spec
  - UI component integration details

---

## 🔧 7. Integration Points
- [ ] Goals engine integrates with forecast engine:
  - Goal progress updated on forecast runs
  - Achievement detection after each simulation
  - Interest saved calculations use forecast comparison
- [ ] Analytics integrated with existing CP-4 events:
  - Same user_id hashing mechanism
  - Same PostHog project and configuration
  - Same error handling and fallback patterns
- [ ] Entitlement system integrates with existing auth:
  - User tier detection from auth context
  - Upgrade prompts link to billing system
  - Free/Pro detection consistent across app

---

## ✅ 8. Reviewer Verification Checklist
- [ ] **Schema Compliance**: All interfaces match docs exactly
- [ ] **Golden Test Coverage**: All 9 scenarios pass, edge cases covered
- [ ] **Analytics Verification**: PostHog shows all 7 events with correct payloads
- [ ] **Entitlement Enforcement**: Limits respected, blocks fire analytics
- [ ] **UI Integration**: All flows work end-to-end in browser
- [ ] **E2E Staging Tests**: Cypress tests pass with PostHog verification
- [ ] **Documentation Sync**: All 5 docs updated and accurate

---

## 🚫 Absolute Merge Policy

**This PR CANNOT be merged** until:
1. Every checkbox above is ticked and verified by reviewer
2. All tests pass (unit, golden scenarios, end-to-end)
3. PostHog verification screenshots/logs provided for both unit and E2E tests
4. All 6 documentation files updated and committed in same PR
5. Entitlement sync test passes

### Deferral Policy
If any item must be deferred, it requires:
- **Explicit documentation** of what's being deferred and why
- **Business justification** for deferral (not technical convenience)
- **Target CP milestone** for completion (e.g. "Challenge Generator Logic → CP-5.1")
- **Lead reviewer sign-off** on deferral with signature and date
- **Tracking issue** created and linked to deferred work

### Definition of Done
- [ ] All 47 checkboxes completed and verified
- [ ] Golden test suite: 9/9 scenarios passing
- [ ] End-to-end tests: All staging flows verified
- [ ] PostHog evidence: Screenshots + event logs attached
- [ ] Documentation: All 6 files updated in same commit
- [ ] No "TODO" comments in production code
- [ ] No hardcoded business rules (all via entitlement config)

---

## 📋 **Reviewer Sign-off Form**

**Primary Reviewer**: _________________________ **Date**: ___________

**Verification Completed**:
- [ ] Schema implementation matches documentation exactly
- [ ] All 9 golden test scenarios pass with exact fixture matching
- [ ] All 7 analytics events verified in PostHog with screenshots
- [ ] Entitlement blocks tested and analytics fired correctly
- [ ] End-to-end UI flows tested in staging environment
- [ ] All 6 documentation files updated and accurate

**Evidence Attached**:
- [ ] PostHog screenshots showing all 7 events with payloads
- [ ] Cypress test results from staging environment
- [ ] Entitlement sync test results

**Sign-off**: This CP-5 implementation meets all blocking requirements, has been verified end-to-end, and is ready for production deployment.

**Signature**: _________________________ **Date**: ___________

**Secondary Reviewer** (if required): _________________________ **Date**: ___________