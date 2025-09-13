# CP-2: Forecast Engine v1 (DEPRECATED)

## Status: ⚠️ DEPRECATED - Use CP-4 for Production

This engine is maintained for backwards compatibility and as a fallback for Free tier users only.

**For accurate multi-APR calculations, use the CP-4 composite engine.**

---

## Purpose

Provide a simple, reliable single-APR forecast engine for Free tier users. This engine implements basic snowball debt payoff calculations without advanced features like:
- Multi-APR bucket support
- Promotional rate tracking
- Balance transfer optimization
- Interest breakdown analysis

## Algorithm

### Interest Calculation
```
Monthly Interest = (Balance × APR/100) ÷ 12
```

### Payment Order
1. Debts are paid in order of `order_index` (ascending)
2. Each debt receives its minimum payment
3. Extra payments go to the first unpaid debt
4. When a debt is paid off, its minimum payment joins the snowball pool

### Snowball Rollover
When Debt A is paid off:
- Its `min_payment` is added to the snowball pool
- The snowball pool is applied to the next debt in order
- This accelerates payoff of remaining debts

### Constraints
- **APR Range**: 0-100%
- **Min Payment**: Must be > 0
- **Max Simulation**: 600 months (50 years)
- **Rounding**: All monetary values rounded to 2 decimal places

## Golden Test Cases

### 1. Single Debt - Basic Progression
- **Input**: £1000 @ 20% APR, £50 min payment
- **Month 1**: Interest = £16.67, Principal = £33.33, Balance = £966.67
- **Month 2**: Interest = £16.11, Principal = £33.89, Balance = £932.78

### 2. Two Debts - Snowball Rollover
- **Debt A**: £500 @ 15% APR, £25 min payment
- **Debt B**: £1000 @ 10% APR, £50 min payment
- **Result**: When A clears (~month 21), its £25 rolls to B (£75 total payment)

### 3. Overpayment - Early Clearance
- **Input**: £1000 @ 20% APR, £50 min + £500 extra
- **Month 1**: £550 payment → Balance = £466.67
- **Month 2**: Remaining balance cleared

### 4. Validation - Invalid Inputs
- **Negative APR**: Returns error "Invalid APR: must be between 0 and 100"
- **Zero Min Payment**: Returns error "Invalid minimum payment: must be greater than 0"
- **APR > 100**: Returns error "Invalid APR: must be between 0 and 100"

## Implementation

### Location
```typescript
src/utils/snowballSimulatorV1.ts
```

### Key Functions
- `simulateSnowballPlanV1()` - Main simulation engine
- `validateDebts()` - Input validation
- `generateForecastSummaryV1()` - UI-friendly summary

### Test Coverage
```typescript
src/__tests__/cp2-forecast-golden.test.ts
src/tests/fixtures/cp2-forecast.fixtures.json
```

## Usage

### Free Tier (Default)
```typescript
import { simulateSnowballPlanV1 } from './utils/snowballSimulatorV1';

const result = simulateSnowballPlanV1(debts, extraPerMonth);
```

### Pro Tier (Use CP-4)
```typescript
import { simulateCompositeSnowballPlan } from './utils/compositeSimulator';

const result = simulateCompositeSnowballPlan(debts, extraPerMonth);
```

## Limitations

⚠️ **This engine does NOT support:**
- Multi-APR buckets (e.g., different rates for purchases vs cash advances)
- Promotional rates (0% APR periods)
- Balance transfer fees and timing
- Compound interest calculations
- Variable rate adjustments
- Interest capitalization

For these features, upgrade to Pro tier and use the CP-4 composite engine.

## Migration Path

### From CP-2 to CP-4
1. Check user tier: `userTier === 'PRO'`
2. If Pro, use CP-4 composite engine
3. If Free, continue using CP-2 for simplicity
4. Both engines use the same `UKDebt` interface

### Breaking Changes
- CP-4 returns additional fields in results (bucket breakdowns, interest analysis)
- CP-4 may show different payoff dates due to more accurate calculations
- CP-4 supports `debt.buckets` array for multi-APR scenarios

## Maintenance

This engine is in **maintenance mode**:
- ✅ Bug fixes for critical issues
- ✅ Security updates
- ❌ No new features
- ❌ No performance optimizations

All new development happens in CP-4.

---

## Definition of Done

- [x] Single-APR engine compiles without TypeScript errors
- [x] All 6 golden test cases pass
- [x] Validation rejects invalid inputs
- [x] Maximum 600-month limit enforced
- [x] All monetary values rounded to 2dp
- [x] Documentation marks engine as deprecated
- [x] Free tier users default to this engine

## Related Documents

- [CP-0: System Overview](./CP-0_SYSTEM_OVERVIEW.md)
- [CP-1: Clean Debt Model](./CP-1_CLEAN_DEBT_MODEL.md)
- [CP-4: Forecast Engine v2](./CP-4_FORECAST_ENGINE_V2.md) - **Use this for production**