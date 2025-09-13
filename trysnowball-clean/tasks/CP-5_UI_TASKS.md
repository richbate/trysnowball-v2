Alright — here’s the UI Phase spec for CP-5. Think of it as CP-5b: the engine is done, now you’re wrapping a skin around it that makes sense to users, without breaking the strict discipline you’ve built.

⸻

CP-5 UI Phase — Goals & Challenges

🎯 Purpose

Expose the already-stable goals engine to users through a clear, motivational interface.
The UI must:
	•	Allow creation, editing, and cancellation of goals.
	•	Show progress and outcomes (achieved, failed, cancelled).
	•	Respect entitlements (free vs pro).
	•	Fire analytics events during flows.

⸻

🧱 Components

1. GoalsPage
	•	Entry point for the Goals & Challenges system.
	•	Lists all active goals + historical (archived) ones.
	•	Shows an “Add Goal” button gated by entitlements.

2. GoalCard
	•	Displays a single goal:
	•	Type (DEBT_CLEAR, AMOUNT_PAID, INTEREST_SAVED, TIMEBOUND).
	•	Current progress (current_value / target_value).
	•	Status badge (ACTIVE, ACHIEVED, FAILED, CANCELLED).
	•	Action buttons: Edit, Cancel (respect entitlements).
	•	UI copy must map exactly to ENUMs in engine.

3. GoalFormModal
	•	Allows user to create or edit a goal.
	•	Type dropdown limited by entitlements.
	•	Validation errors surfaced to user (invalid date, value ≤ 0).

4. EntitlementGate
	•	Reusable component that checks entitlements before allowing creation.
	•	If blocked → show UpgradePrompt with Pro upsell copy.

5. ChallengeBanner
	•	Displays system-suggested challenges (from CP-5.1 later).
	•	Accept = creates Goal, Reject = dismiss.
	•	For now: integrate only assignment flow, not generation logic.

⸻

🧪 Flows
	1.	Goal Creation (Free user)
	•	Attempt 2nd goal → blocked by entitlement → entitlement_blocked fires → UpgradePrompt shown.
	2.	Goal Creation (Pro user)
	•	Create multiple goals of any type.
	•	Analytics: goal_created.
	3.	Progress Tracking
	•	Forecast updates → goal_progressed fires → GoalCard updates progress bar.
	4.	Goal Achievement
	•	Forecast shows condition met → GoalCard updates → goal_achieved event → celebration toast.
	5.	Goal Failure
	•	Target date passes without achievement → GoalCard status = FAILED → goal_failed event.
	6.	Goal Editing
	•	User edits → new target saved → GoalCard updated → goal_updated event.
	7.	Goal Cancellation
	•	User cancels → GoalCard archived → goal_updated event.
	8.	Challenge Assignment
	•	Banner shows suggestion → Accept → Goal created → challenge_assigned + goal_created.

⸻

📊 Analytics Integration
	•	Every UI action must fire the correct engine event (already specced in CP-5_ANALYTICS_SUITE.md).
	•	Cypress tests must assert UI → analytics → PostHog mapping.

⸻

🧪 End-to-End Tests

Cypress scenarios (staging + PostHog dev connected):
	•	Create goal (Free + Pro)
	•	Blocked goal creation (entitlement)
	•	Progressed goal
	•	Achieved goal
	•	Failed goal
	•	Edited goal
	•	Cancelled goal
	•	Challenge assignment

⸻

📚 Documentation Updates
	•	/docs/CP-5_USER_FLOWS.md: update with screenshots of UI states.
	•	/docs/CP-5_BLOCKING_CHECKLIST.md: add UI tick-boxes for each flow.
	•	/docs/CP-5_LIMITATIONS.md: note that goal history is not persistent beyond archive; challenge generation still deferred.

⸻

✅ Definition of Done (UI Phase)
	•	All 5 components implemented and integrated.
	•	All 8 flows working end-to-end.
	•	Analytics firing in PostHog verified with screenshots.
	•	Cypress staging run passes all scenarios.
	•	Docs updated with UI evidence.
	•	CP-5 Blocking Checklist ticked with reviewer sign-off.
