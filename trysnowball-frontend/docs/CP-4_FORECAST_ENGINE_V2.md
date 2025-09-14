# CP-4: Forecast Engine V2 (Composite Simulation)

**Status**: ✅ Complete  
**Last Updated**: 2024-09-11  
**Affects**: All debt payoff simulations, timeline generation, chart rendering

## Purpose

The current implementation of the debt payoff simulation engine, built on the Multi-APR Bucket System (CP-3) to provide accurate, month-by-month projections for debt elimination strategies.

## Architecture Overview

```
User Debts → Clean Debt Model (CP-1) → Bucket System (CP-3) → Forecast Engine V2 → Timeline/Charts
```

## Core Algorithm

### 1. Initialization Phase
```typescript
function initializeForecast(debts: CleanDebt[], extraPayment: number, strategy: Strategy) {
  const buckets = debts.map(debt => new DebtBucket(debt))
  const totalMinimumPayment = buckets.reduce((sum, b) => sum + b.debt.min_payment, 0)
  
  return {
    buckets,
    monthlyBudget: totalMinimumPayment + extraPayment,
    strategy,
    timeline: []
  }
}
```

### 2. Monthly Simulation Loop
```typescript
function simulateMonth(simulation: ForecastSimulation): MonthResult {
  // Step 1: Apply interest to all active debts
  simulation.buckets.forEach(bucket => {
    if (bucket.currentBalance > 0) {
      bucket.applyMonthlyInterest()
    }
  })
  
  // Step 2: Make minimum payments
  const totalMinimums = makeMinimumPayments(simulation.buckets)
  
  // Step 3: Allocate remaining budget based on strategy
  const remainingBudget = simulation.monthlyBudget - totalMinimums
  allocateExtraPayment(simulation.buckets, remainingBudget, simulation.strategy)
  
  // Step 4: Record month results
  return generateMonthSnapshot(simulation)
}
```

### 3. Strategy Execution
The engine supports multiple payment strategies:

**Snowball (Smallest Balance First)**
```typescript
const activeDebts = buckets.filter(b => b.currentBalance > 0)
const target = activeDebts.sort((a, b) => a.currentBalance - b.currentBalance)[0]
target?.applyExtraPayment(extraAmount)
```

**Avalanche (Highest Interest First)**
```typescript
const activeDebts = buckets.filter(b => b.currentBalance > 0)
const target = activeDebts.sort((a, b) => b.debt.apr - a.debt.apr)[0]
target?.applyExtraPayment(extraAmount)
```

**Custom Order**
```typescript
const target = buckets.find(b => b.debt.id === customPriorityOrder[currentIndex])
target?.applyExtraPayment(extraAmount)
```

## Output Format

### Timeline Data Structure
```typescript
interface ForecastTimeline {
  month: number
  date: string
  debts: Array<{
    id: string
    name: string
    balance: number
    interestPaid: number
    principalPaid: number
    isPayedOff: boolean
  }>
  totalBalance: number
  totalInterestPaid: number
  totalPrincipalPaid: number
  monthlyPayment: number
}
```

### Key Metrics
- **Debt-Free Date**: Month when all balances reach zero
- **Total Interest**: Sum of all interest payments across timeline
- **Interest Savings**: Comparison vs. minimum-only payments
- **Payoff Order**: Sequence of debt elimination

## Performance Optimizations

1. **Early Termination**: Stop simulation when all debts paid off
2. **Balance Precision**: Round to nearest cent to avoid floating-point drift
3. **Memory Efficiency**: Only store essential timeline data
4. **Calculation Caching**: Cache monthly interest rates

## Accuracy Features

- **True Compound Interest**: Monthly compounding per debt
- **Individual APR Tracking**: No averaging across debts
- **Precise Payment Allocation**: Down to the penny
- **Realistic Minimum Payments**: Applied before extra payments

## Integration Points

### Frontend Components
- `DebtTimeline.jsx` - Renders month-by-month breakdown
- `SnowballChart.jsx` - Visual debt reduction over time
- `PaymentBreakdownChart.jsx` - Interest vs. principal allocation

### API Endpoints
- `POST /api/forecast` - Generate simulation for authenticated users
- Local calculation for demo mode

## Error Handling

1. **Invalid Debt Data**: Validate against CP-1 Clean Debt Model
2. **Insufficient Payments**: Warn if budget < minimum payments
3. **Calculation Overflow**: Cap simulation at 600 months maximum
4. **Precision Loss**: Round intermediate calculations appropriately

## Testing Strategy

Comprehensive test coverage in `CP-4_TEST_CASES.md` includes:
- Golden scenarios with known outcomes
- Edge cases (very low/high APR, minimal payments)
- Strategy comparison verification
- Mathematical correctness proofs

## Related Documentation
- CP-1: Clean Debt Model (input format)
- CP-3: Bucket System (calculation foundation)
- CP-4_TEST_CASES: Verification scenarios