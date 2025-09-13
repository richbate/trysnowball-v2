# CP-5.1 Challenge Generator — Intelligent Motivation Engine
**Status**: SPEC | **Implementation**: Pending | **Depends on**: CP-5 Complete

## Scope Boundaries

### ✅ **In Scope (CP-5.1)**
- **Challenge Generation Logic**: Analyze forecasts to suggest meaningful challenges
- **Trigger Conditions**: When/why to suggest challenges to users
- **Challenge Validation**: Ensure generated challenges are achievable and motivating
- **Generation Analytics**: Track suggestion logic effectiveness

### ❌ **Out of Scope (Handled in CP-5)**
- **Challenge Assignment**: Creating challenge objects and firing events (already implemented)
- **Challenge UI**: User acceptance/rejection flows (already implemented) 
- **Challenge Progress Tracking**: Same as goal progress (already implemented)
- **Basic Challenge Schema**: Already defined in CP-5

---

## Purpose
Analyze user forecasts and debt progress to intelligently suggest challenges that are:
1. **Achievable** - Based on current trajectory and realistic stretch goals
2. **Motivating** - Create meaningful milestones that drive engagement  
3. **Contextual** - Relevant to user's specific debt situation and progress
4. **Timed** - Appropriate urgency without being overwhelming

---

## Schema

### Challenge Generation Context
```typescript
interface ChallengeContext {
  user_id: string;
  forecast_results: PlanResult[];
  forecast_summary: ForecastSummary;
  active_goals: Goal[];
  user_tier: string;
  debt_history: DebtSnapshot[];
  last_challenge_date?: string;
}
```

### Challenge Suggestion
```typescript
interface ChallengeSuggestion {
  id: string;
  type: GoalType;
  target_value: number;
  target_date: string;
  confidence: number;        // 0-100% confidence this is achievable
  motivation_score: number;  // 0-100% estimated motivation impact
  reason: SuggestionReason;
  context: string;          // User-facing explanation
  debt_id?: string;
  bucket_id?: string;
}
```

### Generation ENUMs (Locked)
```typescript
type SuggestionReason = 
  | "AHEAD_OF_SCHEDULE"      // User beating forecast projections
  | "MILESTONE_APPROACHING"  // Natural milestone within reach
  | "ENGAGEMENT_DROP"        // User activity declining
  | "HIGH_APR_FOCUS"         // Encourage targeting expensive debt
  | "SNOWBALL_MOMENTUM"      // Build on recent successes
  | "SEASONAL_OPPORTUNITY"   // Tax refund, bonus season
  | "PEER_BENCHMARKING";     // Performance vs similar users

type GenerationTrigger = 
  | "FORECAST_UPDATE"        // New forecast calculated
  | "GOAL_ACHIEVED"          // Previous goal completed
  | "PAYMENT_RECORDED"       // Debt balance updated
  | "SCHEDULED_CHECK"        // Weekly/monthly generation
  | "USER_REQUEST";          // Manual "suggest challenge" button
```

---

## Generation Rules

### Rule 1: Ahead of Schedule
**Trigger**: Forecast shows debt clearance 2+ months earlier than previous forecast
**Logic**: Suggest accelerating timeline further
```typescript
if (currentForecast.totalMonths < previousForecast.totalMonths - 2) {
  const monthsSaved = previousForecast.totalMonths - currentForecast.totalMonths;
  suggest({
    type: "TIMEBOUND",
    target_date: addMonths(currentForecast.debtFreeDate, -1),
    reason: "AHEAD_OF_SCHEDULE",
    context: `You're ${monthsSaved} months ahead of schedule! Challenge yourself to finish 1 month earlier.`,
    confidence: 75
  });
}
```

### Rule 2: Milestone Proximity
**Trigger**: Forecast shows natural milestone (£1000, £5000, £10000) within 3 months
**Logic**: Suggest targeting the milestone earlier
```typescript
const milestones = [1000, 5000, 10000, 25000];
milestones.forEach(milestone => {
  const milestoneMonth = findMilestoneMonth(forecast, milestone);
  if (milestoneMonth > 0 && milestoneMonth <= 3) {
    suggest({
      type: "AMOUNT_PAID",
      target_value: milestone,
      target_date: addMonths(startDate, milestoneMonth - 1),
      reason: "MILESTONE_APPROACHING",
      context: `You're close to paying off £${milestone}! Can you hit it 1 month early?`,
      confidence: calculateMilestoneConfidence(forecast, milestone)
    });
  }
});
```

### Rule 3: High APR Priority
**Trigger**: User has debts with APR >25% but forecast shows slow clearance
**Logic**: Suggest aggressive targeting of expensive debt
```typescript
const highAPRDebts = debts.filter(debt => debt.apr > 25);
highAPRDebts.forEach(debt => {
  const clearanceMonth = findDebtClearanceMonth(forecast, debt.id);
  if (clearanceMonth > 6) { // More than 6 months away
    suggest({
      type: "DEBT_CLEAR",
      debt_id: debt.id,
      target_date: addMonths(startDate, Math.min(6, clearanceMonth - 2)),
      reason: "HIGH_APR_FOCUS",
      context: `${debt.name} at ${debt.apr}% APR is costing £X monthly. Focus fire?`,
      confidence: 60
    });
  }
});
```

### Rule 4: Engagement Recovery
**Trigger**: User hasn't updated debts in 30+ days
**Logic**: Suggest gentle re-engagement challenge
```typescript
const daysSinceUpdate = getDaysSinceLastDebtUpdate(user_id);
if (daysSinceUpdate > 30) {
  suggest({
    type: "AMOUNT_PAID",
    target_value: calculateMinimumMonthlypayment(debts) * 1.5,
    target_date: addMonths(startDate, 1),
    reason: "ENGAGEMENT_DROP", 
    context: "Ready for a fresh start? Small win to build momentum.",
    confidence: 85
  });
}
```

---

## Generation Algorithm

### Step 1: Context Analysis
```typescript
function analyzeContext(context: ChallengeContext): ContextAnalysis {
  return {
    progressTrend: calculateProgressTrend(context.debt_history),
    forecastAccuracy: assessForecastAccuracy(context.forecast_results),
    engagementLevel: calculateEngagement(context.debt_history),
    existingGoalLoad: context.active_goals.length,
    availableChallengeSlots: getEntitlementValue('goals.max_active', context.user_tier) - context.active_goals.length
  };
}
```

### Step 2: Apply Generation Rules
```typescript
function generateSuggestions(context: ChallengeContext): ChallengeSuggestion[] {
  const analysis = analyzeContext(context);
  const suggestions: ChallengeSuggestion[] = [];
  
  // Apply each rule and collect suggestions
  suggestions.push(...applyAheadOfScheduleRule(context, analysis));
  suggestions.push(...applyMilestoneProximityRule(context, analysis));
  suggestions.push(...applyHighAPRFocusRule(context, analysis));
  suggestions.push(...applyEngagementRecoveryRule(context, analysis));
  
  return suggestions;
}
```

### Step 3: Score and Filter
```typescript
function selectBestSuggestion(suggestions: ChallengeSuggestion[]): ChallengeSuggestion | null {
  if (suggestions.length === 0) return null;
  
  // Filter by minimum confidence threshold
  const viable = suggestions.filter(s => s.confidence >= 50);
  
  // Score by combination of confidence and motivation impact
  const scored = viable.map(s => ({
    ...s,
    composite_score: (s.confidence * 0.6) + (s.motivation_score * 0.4)
  }));
  
  // Return highest scoring suggestion
  return scored.sort((a, b) => b.composite_score - a.composite_score)[0] || null;
}
```

---

## Golden Test Scenarios

### Scenario 1: Ahead of Schedule Detection
**Input**: Previous forecast: 24 months, Current forecast: 21 months
**Expected**: TIMEBOUND challenge for 20 months, reason "AHEAD_OF_SCHEDULE", confidence 75%

### Scenario 2: Milestone Proximity
**Input**: Forecast shows £5000 paid in month 3
**Expected**: AMOUNT_PAID challenge for £5000 in month 2, reason "MILESTONE_APPROACHING"

### Scenario 3: High APR Targeting
**Input**: Debt with 29.9% APR, clearance projected in month 8
**Expected**: DEBT_CLEAR challenge for month 6, reason "HIGH_APR_FOCUS"

### Scenario 4: No Valid Suggestion
**Input**: User on track, no milestones near, high engagement
**Expected**: null (no suggestion generated)

### Scenario 5: Entitlement Respect
**Input**: Free user with 1 active goal already
**Expected**: null (no suggestion - would exceed entitlement)

---

## Analytics Events

### 1. challenge_generated
**When**: System creates challenge suggestion
```json
{
  "event": "challenge_generated",
  "properties": {
    "user_id": "hashed_user_123",
    "suggestion_id": "suggestion_456", 
    "challenge_type": "TIMEBOUND",
    "reason": "AHEAD_OF_SCHEDULE",
    "confidence": 75.0,
    "motivation_score": 85.0,
    "target_value": 0,
    "target_date": "2025-12-01",
    "forecast_version": "v2.0",
    "generation_trigger": "FORECAST_UPDATE",
    "timestamp": "2025-01-15T14:30:00.000Z"
  }
}
```

### 2. challenge_suppressed  
**When**: Generation logic decides not to suggest challenge
```json
{
  "event": "challenge_suppressed",
  "properties": {
    "user_id": "hashed_user_123",
    "suppression_reason": "INSUFFICIENT_CONFIDENCE",
    "highest_confidence": 45.0,
    "generation_trigger": "SCHEDULED_CHECK",
    "forecast_version": "v2.0",
    "timestamp": "2025-01-15T14:30:00.000Z"
  }
}
```

---

## Integration with CP-5

### Handoff Point
CP-5.1 generates `ChallengeSuggestion` objects, CP-5 converts them to `Goal` objects via assignment flow:

```typescript
// CP-5.1 generates
const suggestion = generateChallenge(context);

// CP-5 handles assignment (already implemented)  
if (suggestion && userAccepts) {
  const challenge = convertSuggestionToGoal(suggestion);
  trackChallengeAssigned(challenge); // Already implemented in CP-5
}
```

### Trigger Integration
CP-5.1 generation triggers plug into existing CP-5 forecast hooks:
- **Forecast Update**: After `useForecast` runs
- **Goal Achievement**: After `goal_achieved` event
- **Payment Recording**: After debt balance updates

---

## Known Limitations

### v1.0 Constraints
- **No Machine Learning**: Rules-based only, no adaptive learning
- **No User Preference**: Cannot learn what motivates individual users  
- **No Seasonality**: Fixed rules, no holiday/seasonal adjustments
- **No Peer Data**: Cannot benchmark against similar users

### Accuracy Dependencies  
- **Forecast Quality**: Suggestions only as good as underlying forecast
- **Engagement Data**: Requires user activity history for context
- **APR Assumptions**: Subject to same APR expiry limitations as forecast

---

## Blocking Requirements (CP-5.1)

- [ ] All 5 golden scenarios implemented and tested
- [ ] Generation analytics (challenge_generated, challenge_suppressed) verified in PostHog
- [ ] Integration triggers working with CP-5 forecast hooks
- [ ] Entitlement limits respected (no suggestions if user at goal limit)
- [ ] No suggestions for users with insufficient forecast data
- [ ] Performance acceptable (generation completes within 100ms)

**This spec ensures CP-5.1 challenge generation is as bulletproof as CP-5 assignment flow.**