# CP-5 Task List — Goals & Challenges Layer

## Engine
- [ ] Implement `Goal` interface + validation rules (see CP-5_GOALS_ENGINE.md)
- [ ] Enforce entitlement checks before goal creation (see ENTITLEMENTS.md)
- [ ] Support all 4 goal types: DEBT_CLEAR, AMOUNT_PAID, INTEREST_SAVED, TIMEBOUND
- [ ] Support cancellation + editing flows
- [ ] Integrate system-suggested challenges (assignment only, generation deferred to CP-5.1)
  - **In Scope**: Accept pre-generated challenges, create Goal objects, fire `challenge_assigned` 
  - **Out of Scope**: Challenge generation logic (see CP-5.1_CHALLENGE_GENERATOR.md)

## Tests
- [ ] Ensure all 9 golden fixtures pass in cp5-goals-golden.test.ts
- [ ] Validate analytics payloads (exact JSON match)
- [ ] Confirm entitlements.sync.test.ts passes (no drift)

## Analytics
- [ ] Fire all 7 events (see CP-5_ANALYTICS_SUITE.md)
- [ ] Validate ENUMs + rounding in payloads
- [ ] Confirm events visible in PostHog dev (attach screenshots/logs in PR)

## UI & Flows
- [ ] Implement GoalsPage + GoalCard + EntitlementGate components
- [ ] Wire up goal creation, progression, achievement, cancellation, editing, challenge assignment
- [ ] Show upgrade prompt when entitlement blocked
- [ ] Ensure analytics events fire during UI flows

## End-to-End
- [ ] Add Cypress tests for 6 flows (goal creation, progress, cancel, edit, challenge assignment, entitlement block)
- [ ] Run tests in staging with PostHog dev connected
- [ ] Attach logs + screenshots to PR

## Documentation
- [ ] Update all 5 docs with any implementation details
- [ ] Tick off CP-5_BLOCKING_CHECKLIST.md in PR

✅ Completion Expectations

Claude must deliver:
	1.	Green Golden Test Suite (cp5-goals-golden.test.ts with all 9 scenarios passing)
	2.	Verified Analytics in PostHog (screenshots/logs in PR)
	3.	Passing Entitlement Sync Test (entitlements.sync.test.ts)
	4.	E2E UI Tests Passing in Staging (Cypress evidence attached)
	5.	All 5 Docs Updated (/docs/) in same PR
	6.	CP-5_BLOCKING_CHECKLIST.md fully ticked with reviewer evidence

No PR merges unless all 6 conditions are met.
