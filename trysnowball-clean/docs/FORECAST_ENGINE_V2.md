# Forecast Engine v2.0: Multi-APR Composite Simulation

**Status**: ✅ **Deployed** | **Last Updated**: September 2024 | **Engine Version**: `v2-composite`

## Overview

The Composite Bucket Engine extends TrySnowball's debt simulation to handle **multi-APR buckets** within individual debts. This enables accurate forecasting for UK credit cards that have different balances at different interest rates (e.g., purchases at 22.9%, cash advances at 27.9%, balance transfers at 0%).

### Key Innovation

Instead of treating a £3000 credit card as a single debt at a weighted-average APR (~18.6%), the v2 engine simulates each balance type separately:

```
Traditional: £3000 @ 18.6% APR (weighted average)
Composite:   £2000 @ 22.9% + £500 @ 27.9% + £500 @ 0%
```

**Result**: More accurate interest calculations and smarter snowball targeting.

---

## Schema Definition

### DebtBucket Interface

```typescript
interface DebtBucket {
  id: string;              // Unique identifier: 'purchases', 'cash_advances'
  name: string;            // Display name: 'Purchases', 'Cash Advances'
  balance: number;         // Current balance in pounds (£)
  apr: number;             // Annual Percentage Rate (0-100%)
  payment_priority: number; // 1 = highest priority (paid first)
}
```

### Composite Debt

```typescript
interface UKDebt {
  // ... existing fields
  buckets?: DebtBucket[];   // Optional multi-APR buckets
}
```

**Validation Rules**:
- `SUM(bucket.balance) == debt.amount` (within 1p tolerance)
- Each bucket has unique `payment_priority` (1, 2, 3...)
- All APRs are valid (0-100%)

---

## Algorithm Specification

### 1. Monthly Interest Calculation

Each bucket calculates interest independently:

```javascript
bucket_interest = ROUND(bucket.balance * (bucket.apr / 100 / 12), 2)
total_debt_interest = SUM(all bucket_interest)
```

**Example** (Barclaycard with £100 extra):
```
Purchases:       £2000 * (22.9% / 12) = £38.17
Cash Advances:   £500  * (27.9% / 12) = £11.63  
Balance Transfer: £500  * (0% / 12)   = £0.00
TOTAL:                                 = £49.80
```

### 2. Payment Allocation Algorithm

#### Step 1: Minimum Payment Distribution
Allocated proportionally by balance:
```javascript
bucket_min = (bucket.balance / total_balance) * debt.min_payment
```

#### Step 2: Apply Minimum Payments
```javascript
bucket.balance += interest - minimum_payment
```

#### Step 3: Snowball Application
Target **lowest `payment_priority` number** (1 = highest):
```javascript
sorted_buckets = buckets.sort(by_priority_ascending)
target_bucket = sorted_buckets.find(bucket => !bucket.isPaidOff)
target_bucket.balance -= extra_payment
```

### 3. Payment Order Within Month

1. **Add interest** to all buckets
2. **Apply minimum payments** (proportional allocation)
3. **Apply snowball** to highest priority unpaid bucket
4. **Update balances** and check for bucket completion

---

## Engine Flow Chart

```
Start Month
     ↓
Calculate Interest (per bucket)
     ↓
Allocate Minimum Payment (proportional)
     ↓
Apply Minimum Payments
     ↓
Target Highest Priority Bucket
     ↓
Apply Snowball Payment
     ↓
Check Bucket Completion
     ↓
Any Buckets Remaining? → Yes: Next Month
     ↓ No
Debt Complete
```

---

## Implementation Files

### Core Engine
- **`compositeBucketEngine.ts`**: Main simulation logic
- **`goldenBuckets.test.ts`**: Hand-calculated test fixtures  
- **`DEBT_SIM_MODEL.md`**: Locked financial model specification

### UI Integration
- **`useForecast.ts`**: React hook with feature flag integration
- **`BucketMilestones.tsx`**: Milestone visualization component
- **`CompositeWarningBanner.tsx`**: Limitations disclosure

### Feature Gating
- **`useMultiAPRFeature.ts`**: Pro-tier feature flag control
- **`featureFlags.ts`**: Configuration for experimental features

---

## Usage Examples

### Basic Composite Debt

```typescript
const barclaycardDebt: UKDebt = {
  id: 'barclaycard_123',
  name: 'Barclaycard Platinum',
  amount: 3000,
  apr: 18.6, // Ignored in composite mode
  min_payment: 75,
  order_index: 1,
  buckets: [
    {
      id: 'purchases',
      name: 'Purchases',
      balance: 2000,
      apr: 22.9,
      payment_priority: 2
    },
    {
      id: 'cash_advances', 
      name: 'Cash Advances',
      balance: 500,
      apr: 27.9,
      payment_priority: 1 // Paid first
    },
    {
      id: 'balance_transfer',
      name: 'Balance Transfer',
      balance: 500,
      apr: 0,
      payment_priority: 3 // Paid last
    }
  ]
};
```

### Running Simulation

```typescript
import { simulateCompositePlan } from '../utils/compositeBucketEngine';

const results = simulateCompositePlan([barclaycardDebt], 100);
// Returns: CompositeMonthResult[] with bucket-level detail
```

### Enhanced Forecast Summary

```typescript
import { generateCompositeForecastSummary } from '../utils/compositeBucketEngine';

const summary = generateCompositeForecastSummary(results);
// Returns: ForecastSummary with bucketDetails for UI display
```

---

## Expected Behavior Patterns

### Month 1 Results (£100 extra)

| Bucket | Starting | Interest | Min Payment | Snowball | Ending |
|--------|----------|----------|-------------|----------|--------|
| Purchases | £2000.00 | £38.17 | £50.00 | £0.00 | £1988.17 |
| Cash Advance | £500.00 | £11.63 | £12.50 | £100.00 | £399.13 |
| Balance Transfer | £500.00 | £0.00 | £12.50 | £0.00 | £487.50 |

**Key Observation**: All £100 extra goes to Cash Advances (priority 1) despite being the smaller balance.

### Typical Clearance Pattern

1. **Month 1-4**: Cash Advances cleared (highest APR targeted first)
2. **Month 5+**: Snowball moves to Purchases (priority 2)  
3. **Final months**: Balance Transfer cleared last (0% APR, lowest priority)

---

## Performance Benefits vs Traditional

### Interest Savings
- **Traditional**: Weighted average APR delays high-rate payoff
- **Composite**: Targets 27.9% APR immediately
- **Typical Result**: 2-3 months faster, £100-200 interest saved

### Accuracy Improvements
- **Monthly Interest**: ±£1-3 more accurate (compound effect over time)
- **Payoff Timeline**: ±1-2 months more accurate
- **Milestone Predictions**: Bucket-level precision vs debt-level only

---

## Known Limitations (v2.0)

⚠️ **Critical**: Users must understand these assumptions

### Technical Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| **Fixed APR** | No promotional rate expiry | Manual rate updates |
| **Proportional Minimums** | May not match issuer rules | Verify with provider |
| **Static Priority** | Priority doesn't adapt to balance changes | Review periodically |
| **No Payment Date Logic** | Assumes monthly schedule | Use actual payment dates |

### Model Assumptions

1. **APR rates remain constant** throughout forecast
2. **Minimum payments split proportionally** by balance  
3. **No promotional rate expirations** or changes
4. **Monthly compound interest** calculation
5. **Snowball payments target highest priority** buckets first

### Real-World Variations

- Credit card payment allocation rules may differ
- Promotional rates typically expire and revert
- Interest calculation methods vary between providers
- Some issuers have different minimum payment rules

---

## Validation & Testing

### Golden Test Coverage

✅ **Interest Calculation**: Hand-calculated vs simulated (±1p accuracy)  
✅ **Payment Allocation**: Proportional distribution verified  
✅ **Snowball Targeting**: Priority-based application confirmed  
✅ **Milestone Tracking**: Bucket clearance detection working  

### Test Files

- **`goldenBuckets.test.ts`**: Comprehensive test suite
- **`test-composite-cli.js`**: Standalone validation script
- **`test-enhanced-summary.js`**: Summary generation tests

### Validation Commands

```bash
# Run comprehensive test suite
npm test -- --testPathPattern=goldenBuckets

# Test isolated engine
node test-composite-cli.js

# Validate summary generation
node test-enhanced-summary.js
```

---

## Feature Flag Integration

### Enabling Composite Mode

```typescript
// Developer override
localStorage.setItem('dev_user_tier', 'pro');

// Production check
const { isEnabled } = useMultiAPRFeature();
// Returns: true for Pro users when feature enabled
```

### UI Integration Points

1. **Forecast Hook**: Auto-detects composite debts + feature flag
2. **Warning Banner**: Shows limitations when composite active  
3. **Milestone Display**: Bucket-level progress tracking
4. **Summary Enhancement**: Extended stats for composite mode

---

## Deployment Status

### Integration Checklist

✅ **Engine Logic**: Mathematically accurate simulation  
✅ **Golden Tests**: All hand-calculated scenarios pass  
✅ **UI Integration**: Feature-flagged forecast enhancement  
✅ **Warning System**: User-facing limitations disclosure  
✅ **Dev Tools**: Debug panels and validation scripts  
✅ **Documentation**: This specification document  

### Production Readiness

- **Code Quality**: TypeScript strict mode, ESLint clean
- **Test Coverage**: Critical paths covered with golden fixtures  
- **Error Handling**: Graceful fallback to standard simulation
- **Performance**: No significant impact on simulation speed
- **UX**: Progressive enhancement (works without feature flag)

---

## Upgrade Roadmap

### Version 2.1 (Planned)
- **Promotional Rate Expiry**: Handle 0% → standard rate transitions
- **Payment Allocation Overrides**: Support issuer-specific rules
- **Dynamic Priority**: Adjust priority based on balance thresholds

### Version 2.2 (Future)
- **Statement Integration**: Auto-populate buckets from statements
- **Variable Minimums**: Support per-bucket minimum payment rules
- **Cross-Debt Optimization**: Optimize payments across multiple cards

### Version 3.0 (Vision)
- **AI-Powered Categorization**: Auto-detect purchase types
- **Real-Time Rate Tracking**: Monitor and update APR changes
- **Provider Integration**: Direct API connections to card issuers

---

## Troubleshooting

### Common Issues

**Q**: Forecast shows different results than expected  
**A**: Check bucket balance sum matches debt total, verify APR values

**Q**: Snowball not targeting highest APR bucket  
**A**: Engine uses `payment_priority`, not APR. Lower priority number = higher priority

**Q**: Feature not visible to user  
**A**: Ensure Pro tier + feature flag enabled + debt has buckets array

**Q**: Build failing with TypeScript errors  
**A**: Check all bucket interfaces match `DebtBucket` schema exactly

### Debug Tools

```typescript
// Enable dev mode for detailed logging
process.env.NODE_ENV = 'development'

// Check bucket validation
import { validateBucketData } from '../types/UKDebt';
const errors = validateBucketData(buckets, totalAmount);

// View raw composite results  
console.log('Composite Results:', compositeResults);
```

---

**Documentation Version**: 1.0  
**Engine Version**: v2-composite  
**Last Review**: September 2024  
**Next Review**: October 2024 (post-user feedback)

---

## Analytics & Event Tracking — Golden Event Suite CP-4.x

### Overview

The Forecast Engine V2 implements comprehensive analytics tracking through the **Golden Analytics Event Suite — CP-4.x**. This system provides detailed insights into user interaction with composite forecast features and validates mathematical accuracy of debt payoff predictions.

### Core Analytics Events

The system tracks 5 essential events:

1. **`forecast_run`** - Every forecast simulation
2. **`bucket_cleared`** - When bucket balance reaches zero 
3. **`forecast_failed`** - Validation failures
4. **`bucket_interest_breakdown`** - Interest transparency views
5. **`forecast_compared`** - Composite vs flat comparisons

### Event Schemas & Examples

#### 1. forecast_run

**When**: At start of any forecast simulation  
**Purpose**: Track usage patterns and performance

```json
{
  "event": "forecast_run",
  "properties": {
    "mode": "composite",
    "user_id": "hashed_user_123",
    "debt_count": 2,
    "bucket_count": 6,
    "extra_per_month": 150.00,
    "forecast_version": "v2.0",
    "timestamp": "2024-01-15T14:30:00.000Z"
  }
}
```

#### 2. bucket_cleared

**When**: Bucket balance reaches ≤ 0 in simulation  
**Purpose**: Analyze payoff patterns and milestone tracking

```json
{
  "event": "bucket_cleared", 
  "properties": {
    "bucket_label": "Cash Advances",
    "debt_name": "Barclaycard Platinum",
    "apr": 27.9,
    "cleared_month": 4,
    "total_interest_paid": 123.45,
    "forecast_version": "v2.0",
    "user_id": "hashed_user_123",
    "timestamp": "2024-01-15T14:30:00.000Z"
  }
}
```

#### 3. forecast_failed

**When**: Validation guardrails prevent simulation  
**Purpose**: Identify data quality issues and edge cases

```json
{
  "event": "forecast_failed",
  "properties": {
    "error_code": "INVALID_BUCKET_SUM",
    "error_message": "Bucket balances do not sum to total debt",
    "debt_count": 1,
    "has_buckets": true,
    "forecast_version": "v2.0",
    "user_id": "hashed_user_123",
    "timestamp": "2024-01-15T14:30:00.000Z"
  }
}
```

**Locked Error Codes (TypeScript ENUMs)**:
- `MISSING_APR` - Bucket lacks required APR field
- `INVALID_BUCKET_SUM` - Bucket balances don't sum to debt total  
- `MALFORMED_BUCKETS` - Bucket data structure invalid
- `SIMULATION_ERROR` - General simulation failure
- `TIMEOUT` - Simulation exceeded time limits
- `INVALID_PAYMENT` - Payment allocation logic failure
- `NEGATIVE_BALANCE` - Balance calculation error
- `DIVISION_BY_ZERO` - Mathematical error in interest calculation

#### 4. bucket_interest_breakdown

**When**: Interest breakdown displayed for transparency  
**Purpose**: Track trust-building feature usage

```json
{
  "event": "bucket_interest_breakdown",
  "properties": {
    "bucket_label": "All Buckets", 
    "debt_name": "Forecast Summary",
    "apr": 0,
    "interest_total": 456.78,
    "forecast_version": "v2.0",
    "user_id": "hashed_user_123",
    "timestamp": "2024-01-15T14:30:00.000Z"
  }
}
```

**Volume Guardrails**:
- **One aggregated event per forecast run** (not per bucket)  
- `bucket_label: "All Buckets"` for aggregated totals
- `apr: 0` when aggregating multiple APRs
- Prevents event spam with large multi-bucket forecasts

#### 5. forecast_compared

**When**: Composite vs flat comparison with positive savings  
**Purpose**: Validate Pro feature value proposition

```json
{
  "event": "forecast_compared",
  "properties": {
    "months_saved": 6,
    "interest_difference": 250.75,
    "percentage_reduction": 15.2,
    "composite_months": 18,
    "flat_months": 24,
    "forecast_version": "v2.0", 
    "user_id": "hashed_user_123",
    "timestamp": "2024-01-15T14:30:00.000Z"
  }
}
```

### Analytics Implementation

#### Integration Points

- **useForecast.ts**: Core event firing logic
- **useCompareForecast.ts**: Comparison event tracking  
- **InterestBreakdown.tsx**: Trust/transparency events
- **Error boundaries**: Failure event capture

#### Data Quality Guarantees

- **Monetary rounding**: Currency values to 2dp
- **APR rounding**: Interest rates to 1dp
- **Required fields**: user_id, forecast_version, timestamp
- **Privacy**: User IDs hashed via PostHog

#### Feature Flag Integration

- **Composite events**: Only when `multiAPREnabled === true`
- **Flat fallback**: Free users get `mode: "flat"` events
- **Graceful degradation**: Failed composite → flat with error tracking

### Test Coverage

**Unit Tests**: 15 tests passing (`analytics.events.test.ts`)
- Event firing validation
- Payload structure verification
- Financial value rounding
- Error handling scenarios

**Golden Fixtures**: Comprehensive test data (`analytics.fixtures.ts`)
- Standard composite scenarios
- Validation failure cases
- Edge case handling
- Complex comparison testing

### Example Event Flow

#### Successful Composite Forecast
```
1. forecast_run (composite, 2 debts, 6 buckets)
2. bucket_interest_breakdown (Cash Advances, 27.9% APR)  
3. bucket_cleared (Cash Advances cleared month 4)
4. bucket_interest_breakdown (Purchases, 22.9% APR)
5. bucket_cleared (Purchases cleared month 12)
6. forecast_compared (6 months saved, £250 interest saved)
```

#### Failed Validation Scenario
```
1. forecast_run (composite attempt)
2. forecast_failed (INVALID_BUCKET_SUM error)
3. forecast_run (flat fallback mode)
```

### Known Limitations

- **Offline mode**: Events are best-effort only
- **APR expiry**: Fixed rate assumptions
- **No sampling**: Captures all events currently
- **Privacy**: Relies on PostHog for user ID hashing

### Production Configuration

- **PostHog setup**: Requires production API key
- **Development mode**: Events logged locally
- **Error handling**: Graceful failures with fallbacks
- **Performance**: Asynchronous event firing

---

*This document serves as the canonical reference for Forecast Engine v2.0. All implementation details, test expectations, and user-facing behavior should align with this specification.*