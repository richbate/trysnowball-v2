# CP-4 Golden Analytics Event Suite
**Status**: ✅ DEPLOYED | **Version**: CP-4.x | **Tests**: 15 passing

## Core Events (5 Total)

### 1. forecast_run
**When**: Start of any forecast simulation
**Purpose**: Track usage patterns and performance

```json
{
  "mode": "composite" | "flat",
  "user_id": "hashed_user_123",
  "debt_count": 2,
  "bucket_count": 6,
  "extra_per_month": 150.00,
  "forecast_version": "v2.0",
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

### 2. bucket_cleared
**When**: Bucket balance reaches ≤0 in simulation
**Purpose**: Analyze payoff patterns

```json
{
  "bucket_label": "Cash Advances",
  "debt_name": "Barclaycard Platinum",
  "apr": 27.9,
  "cleared_month": 4,
  "total_interest_paid": 123.45,
  "forecast_version": "v2.0",
  "user_id": "hashed_user_123",
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

### 3. forecast_failed
**When**: Validation prevents simulation
**Purpose**: Identify data quality issues

```json
{
  "error_code": "INVALID_BUCKET_SUM",
  "error_message": "Bucket balances do not sum to total debt",
  "debt_count": 1,
  "has_buckets": true,
  "forecast_version": "v2.0",
  "user_id": "hashed_user_123",
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

### 4. bucket_interest_breakdown
**When**: Interest breakdown displayed
**Purpose**: Track trust-building feature usage

```json
{
  "bucket_label": "All Buckets",
  "debt_name": "Forecast Summary",
  "apr": 0,
  "interest_total": 456.78,
  "forecast_version": "v2.0",
  "user_id": "hashed_user_123",
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

### 5. forecast_compared
**When**: Composite vs flat comparison with savings
**Purpose**: Validate Pro feature value

```json
{
  "months_saved": 6,
  "interest_difference": 250.75,
  "percentage_reduction": 15.2,
  "composite_months": 18,
  "flat_months": 24,
  "debt_count": 2,
  "bucket_count": 6,
  "extra_per_month": 150.00,
  "forecast_version": "v2.0",
  "user_id": "hashed_user_123",
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

## Error Code ENUMs (Locked)
```typescript
export const FORECAST_ERROR_CODES = {
  MISSING_APR: 'MISSING_APR',
  INVALID_BUCKET_SUM: 'INVALID_BUCKET_SUM',
  MALFORMED_BUCKETS: 'MALFORMED_BUCKETS',
  SIMULATION_ERROR: 'SIMULATION_ERROR',
  TIMEOUT: 'TIMEOUT',
  INVALID_PAYMENT: 'INVALID_PAYMENT',
  NEGATIVE_BALANCE: 'NEGATIVE_BALANCE',
  DIVISION_BY_ZERO: 'DIVISION_BY_ZERO'
} as const;
```

## Data Quality Guarantees
- **Currency rounding**: 2 decimal places
- **APR rounding**: 1 decimal place  
- **Volume guardrails**: Aggregated events prevent spam
- **Required fields**: user_id, forecast_version, timestamp
- **Privacy**: User IDs hashed via PostHog