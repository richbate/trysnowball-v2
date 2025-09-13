# CP-5 Goals Engine
**Status**: SPEC | **Implementation**: UI Complete (Backend Pending) | **Version**: v1.0

## Purpose
Short-term motivational targets layered on top of forecasts and debt milestones. Users can set, track, and celebrate goals (self-directed) and challenges (system-suggested).

## Schema

### Goal Object
```typescript
interface Goal {
  id: string;
  user_id: string;
  debt_id?: string;        // Optional: tie goal to specific debt
  bucket_id?: string;      // Optional: tie goal to specific bucket (Pro only)
  type: GoalType;
  target_value: number;    // Amount or months, depending on type
  current_value: number;   // Progress tracking
  status: GoalStatus;
  start_date: string;      // ISO YYYY-MM-DD
  target_date: string;     // ISO YYYY-MM-DD
  created_at: string;      // ISO date string
  updated_at: string;      // ISO date string
}
```

### ENUMs (Locked)
```typescript
type GoalType = "DEBT_CLEAR" | "AMOUNT_PAID" | "INTEREST_SAVED" | "TIMEBOUND";
type GoalStatus = "ACTIVE" | "ACHIEVED" | "FAILED" | "CANCELLED";
```

## Validation Rules
- `target_value > 0`
- `target_date > start_date` 
- One active `DEBT_CLEAR` goal per debt/bucket
- Status transitions: `ACTIVE → [ACHIEVED | FAILED | CANCELLED]`
- Entitlement limits enforced before creation

## Golden Test Scenarios

### 1. Debt Clear Goal
**Input**: "Clear Cash Advance by March 2025"
**Logic**: Goal achieved when forecast shows bucket clearance ≤ target_date
**Test**: Create goal, run forecast, verify achievement detection

### 2. Amount Paid Goal  
**Input**: "Pay £500 towards Barclaycard by June 2025"
**Logic**: `current_value` increments with each payment, achieved when ≥ `target_value`
**Test**: Track payment progress, verify milestone at £500

### 3. Interest Saved Goal
**Input**: "Save £200 in interest by end of 2025" 
**Logic**: Achieved if `interest_saved_vs_minimum >= target_value`
**Test**: Compare against minimum-payment-only forecast

### 4. Timebound Goal
**Input**: "Debt-free by Jan 2027"
**Logic**: Achieved if debt-free date ≤ target_date, else FAILED
**Test**: Verify against forecast summary debt-free date

### 5. Entitlement Block
**Input**: Free user tries to create 2nd goal
**Logic**: Engine blocks, throws entitlement error, logs `entitlement_blocked`
**Test**: Verify limit enforcement and analytics firing

## Engine Integration Points
- **Forecast Hook**: Update goal progress on each simulation run
- **Debt Updates**: Recalculate `current_value` on debt changes
- **Milestone Detection**: Check achievement conditions after forecast
- **Entitlement Check**: Validate limits before goal creation
- **Goal Cancellation**: User cancels → status `CANCELLED`, fires `goal_updated`
- **Goal Editing**: User modifies target → updates values, fires `goal_updated`
- **Challenge Assignment**: System suggests challenges based on forecast analysis

## Additional Test Scenarios

### 6. Goal Cancellation
**Input**: User cancels active "Pay £500 towards Barclaycard" goal
**Logic**: Status updates to `CANCELLED`, analytics `goal_updated` fired
**Test**: Verify status change, analytics payload, UI removal

### 7. Goal Editing  
**Input**: User changes target from £500 to £750
**Logic**: Target updated, analytics `goal_updated` fired with old/new values
**Test**: Verify target change, progress recalculation, analytics payload

### 8. Challenge Assignment
**Input**: User ahead of forecast schedule for debt clearance  
**Logic**: System suggests "Clear 2 months early" challenge
**Test**: Verify challenge creation, `challenge_assigned` analytics, user acceptance flow
**Note**: Challenge **generation** logic deferred to CP-5.1 - this test covers assignment only