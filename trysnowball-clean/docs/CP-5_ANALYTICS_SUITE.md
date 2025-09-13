# CP-5 Analytics Suite
**Status**: SPEC | **Events**: 7 Total | **Integration**: PostHog

## Purpose
Track creation, progress, and outcome of goals, plus entitlement enforcement.

## Core Events (7 Total)

### 1. goal_created
**When**: User successfully creates new goal
**Purpose**: Track goal adoption and types

```json
{
  "event": "goal_created",
  "properties": {
    "user_id": "hashed_user_123",
    "goal_id": "goal_456",
    "goal_type": "AMOUNT_PAID",
    "target_value": 500.00,
    "target_date": "2025-06-01",
    "debt_id": "debt_789",
    "bucket_id": null,
    "forecast_version": "v2.0",
    "timestamp": "2025-01-15T14:30:00.000Z"
  }
}
```

### 2. goal_updated  
**When**: Goal status changes or target modified
**Purpose**: Track goal lifecycle management

```json
{
  "event": "goal_updated",
  "properties": {
    "user_id": "hashed_user_123",
    "goal_id": "goal_456",
    "goal_type": "AMOUNT_PAID",
    "old_status": "ACTIVE",
    "new_status": "ACHIEVED",
    "forecast_version": "v2.0",
    "timestamp": "2025-01-15T14:30:00.000Z"
  }
}
```

### 3. goal_progressed
**When**: Goal current_value updates (not every increment, batched)
**Purpose**: Track engagement with goal tracking

```json
{
  "event": "goal_progressed", 
  "properties": {
    "user_id": "hashed_user_123",
    "goal_id": "goal_456",
    "goal_type": "AMOUNT_PAID",
    "current_value": 250.00,
    "target_value": 500.00,
    "progress_percentage": 50.0,
    "forecast_version": "v2.0",
    "timestamp": "2025-01-15T14:30:00.000Z"
  }
}
```

### 4. goal_achieved
**When**: Goal reaches achievement condition
**Purpose**: Celebrate success and measure completion rates

```json
{
  "event": "goal_achieved",
  "properties": {
    "user_id": "hashed_user_123", 
    "goal_id": "goal_456",
    "goal_type": "AMOUNT_PAID",
    "target_value": 500.00,
    "achieved_date": "2025-05-15",
    "days_to_achievement": 120,
    "forecast_version": "v2.0",
    "timestamp": "2025-01-15T14:30:00.000Z"
  }
}
```

### 5. goal_failed
**When**: Goal passes target_date without achievement
**Purpose**: Identify failure patterns and improve targeting

```json
{
  "event": "goal_failed",
  "properties": {
    "user_id": "hashed_user_123",
    "goal_id": "goal_456", 
    "goal_type": "DEBT_CLEAR",
    "target_value": 1000.00,
    "current_value": 750.00,
    "failed_date": "2025-03-01",
    "completion_percentage": 75.0,
    "forecast_version": "v2.0",
    "timestamp": "2025-01-15T14:30:00.000Z"
  }
}
```

### 6. challenge_assigned
**When**: System suggests challenge to user
**Purpose**: Track system-initiated motivation

```json
{
  "event": "challenge_assigned",
  "properties": {
    "user_id": "hashed_user_123",
    "challenge_type": "TIMEBOUND",
    "challenge_id": "challenge_789",
    "target_value": 2.0,
    "target_date": "2025-04-01", 
    "suggested_reason": "on_track_for_early_completion",
    "forecast_version": "v2.0",
    "timestamp": "2025-01-15T14:30:00.000Z"
  }
}
```

### 7. entitlement_blocked
**When**: User hits entitlement limit
**Purpose**: Track upgrade conversion opportunities

```json
{
  "event": "entitlement_blocked",
  "properties": {
    "user_id": "hashed_user_123",
    "feature": "goals.max_active",
    "user_tier": "free",
    "attempted_value": 2,
    "limit_value": 1,
    "blocked_action": "goal_creation",
    "forecast_version": "v2.0",
    "timestamp": "2025-01-15T14:30:00.000Z"
  }
}
```

## ENUMs (Locked)

```typescript
type AnalyticsGoalType = "DEBT_CLEAR" | "AMOUNT_PAID" | "INTEREST_SAVED" | "TIMEBOUND";
type AnalyticsGoalStatus = "ACTIVE" | "ACHIEVED" | "FAILED" | "CANCELLED";
type EntitlementFeature = "goals.max_active" | "goals.allowed_types";
```

## Error ENUMs (Locked)

```typescript
export const GOAL_ERROR_CODES = {
  ENTITLEMENT_LIMIT_EXCEEDED: 'ENTITLEMENT_LIMIT_EXCEEDED',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  INVALID_TARGET_VALUE: 'INVALID_TARGET_VALUE',
  GOAL_NOT_FOUND: 'GOAL_NOT_FOUND',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  DEBT_NOT_FOUND: 'DEBT_NOT_FOUND',
  BUCKET_NOT_FOUND: 'BUCKET_NOT_FOUND'
} as const;
```

## Event Integration with CP-4

### Alignment with Existing Events
- **Same PostHog project**: Uses existing configuration
- **Same user_id hashing**: Consistent with CP-4 forecast events
- **Same error handling**: Graceful fallback patterns
- **Same development mode**: Local logging when PostHog unavailable

### Cross-Event Analysis Opportunities
- Compare `goal_created` with `forecast_run` events for adoption analysis
- Track `goal_achieved` against `bucket_cleared` for accuracy validation
- Monitor `entitlement_blocked` conversion to billing events

## Data Quality Guarantees
- **Currency rounding**: 2 decimal places
- **Percentage rounding**: 1 decimal place  
- **Required fields**: user_id, goal_id, goal_type, forecast_version, timestamp
- **Privacy**: User IDs hashed via PostHog
- **Volume control**: goal_progressed batched, not per-increment
- **Deduplication**: Prevent duplicate events within 5-second window