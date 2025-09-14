# CP-4: Forecast Engine V2 Test Cases

**Status**: 🛠️ Expanding  
**Last Updated**: 2024-09-11  
**Affects**: Quality assurance, mathematical correctness verification

## Purpose

Golden test scenarios and mathematical proofs to ensure Forecast Engine V2 produces accurate debt payoff simulations.

## Test Categories

### Golden Scenarios (Known Outcomes)

#### Test Case 1: Single Debt, Round Numbers
```typescript
const testDebt = {
  id: "test_1",
  name: "Test Credit Card", 
  amount: 1000.00,
  apr: 12.00,
  min_payment: 50.00
}

// Expected: 21 months to payoff with $50 payments
// Expected: $49.82 total interest
// Mathematical proof: PMT formula verification
```

#### Test Case 2: Two-Debt Snowball
```typescript
const testDebts = [
  { id: "small", name: "Small Card", amount: 500.00, apr: 18.00, min_payment: 25.00 },
  { id: "large", name: "Large Card", amount: 2000.00, apr: 15.00, min_payment: 60.00 }
]

// Extra payment: $100/month
// Expected: Small debt paid off first (month 5)
// Expected: Total payoff in ~24 months
// Expected: Specific interest breakdown per debt
```

#### Test Case 3: Two-Debt Avalanche
```typescript
// Same debts as Test Case 2, avalanche strategy
// Expected: Large debt (15% APR) paid off first
// Expected: Lower total interest than snowball
// Expected: Longer time than snowball
```

### Edge Cases

#### Test Case 4: Minimum-Only Payments
```typescript
const minOnlyDebt = {
  id: "min_only",
  name: "Minimum Only",
  amount: 5000.00,
  apr: 24.00,
  min_payment: 100.00  // 2% minimum
}

// Expected: Very long payoff (decades)
// Expected: High total interest (potentially > principal)
// Stress test: Does calculation handle 100+ month scenarios?
```

#### Test Case 5: Zero APR Debt
```typescript
const zeroAPRDebt = {
  id: "zero_apr",
  name: "Promotional Rate",
  amount: 1000.00,
  apr: 0.00,
  min_payment: 50.00
}

// Expected: Exactly 20 months to payoff
// Expected: Zero interest charges
// Edge case: No division by zero errors
```

#### Test Case 6: Very High APR
```typescript
const highAPRDebt = {
  id: "payday_loan",
  name: "Emergency Loan",
  amount: 500.00,
  apr: 99.99,
  min_payment: 25.00
}

// Expected: Payment insufficient to cover interest
// Expected: Balance growth if min_payment < monthly interest
// Edge case: Warn user of impossible payoff scenario
```

### Mathematical Correctness Proofs

#### Interest Calculation Verification
```typescript
// Monthly interest rate: APR / 12
// For 18% APR: monthly rate = 0.18 / 12 = 0.015
// For $1000 balance: monthly interest = $1000 * 0.015 = $15.00

function verifyInterestCalculation(balance: number, apr: number): boolean {
  const monthlyRate = apr / 100 / 12
  const expectedInterest = balance * monthlyRate
  const actualInterest = calculateMonthlyInterest(balance, apr)
  
  return Math.abs(actualInterest - expectedInterest) < 0.01
}
```

#### Payment Allocation Verification
```typescript
// Payment allocation: Interest first, then principal
// For $100 payment on $1000 @ 18% APR:
// Interest: $15.00
// Principal: $85.00
// New balance: $915.00

function verifyPaymentAllocation(payment: number, balance: number, apr: number) {
  const interest = calculateMonthlyInterest(balance, apr)
  const principal = Math.max(0, payment - interest)
  const newBalance = Math.max(0, balance - principal)
  
  return { interest, principal, newBalance }
}
```

### Strategy Comparison Tests

#### Test Case 7: Snowball vs Avalanche Outcomes
```typescript
const mixedPortfolio = [
  { id: "high_balance_low_apr", amount: 5000.00, apr: 8.00, min_payment: 100.00 },
  { id: "low_balance_high_apr", amount: 1000.00, apr: 24.00, min_payment: 50.00 }
]

// Snowball: Pay off small debt first (lower total interest)
// Avalanche: Pay off high APR first (faster payoff)
// Verify: Avalanche always has lower or equal total interest
// Verify: Snowball often has earlier "first debt payoff" milestone
```

### Precision and Rounding Tests

#### Test Case 8: Floating Point Precision
```typescript
// Test debt amounts that cause floating point precision issues
const precisionDebt = {
  id: "precision",
  name: "Precision Test",
  amount: 1000.33,  // Non-round amount
  apr: 13.57,       // Non-round APR
  min_payment: 27.89 // Non-round payment
}

// Expected: All intermediate calculations rounded to nearest cent
// Expected: Final balance reaches exactly 0.00, not 0.01 or -0.01
```

### Performance Tests

#### Test Case 9: Large Portfolio
```typescript
// Stress test with many debts
const largePortfolio = generateRandomDebts(50)  // 50 random debts

// Performance target: < 500ms for full simulation
// Memory target: < 10MB additional memory usage
// Expected: Accurate results regardless of portfolio size
```

### Regression Tests

#### Test Case 10: Known Bug Scenarios
```typescript
// Document any historical calculation bugs and their expected fixes
// Example: "Month 13 payoff rounding error" - should result in exact $0.00 balance
// Example: "Negative balance overflow" - should never go below $0.00
```

## Test Implementation

### Automated Test Suite
```typescript
describe('Forecast Engine V2', () => {
  test.each(goldenScenarios)('Golden scenario: %s', (scenario) => {
    const result = runForecastSimulation(scenario.debts, scenario.extraPayment, scenario.strategy)
    expect(result).toMatchSnapshot(scenario.expected)
  })
})
```

### Manual Verification
1. Compare results against online debt calculators
2. Verify complex scenarios with spreadsheet models
3. Cross-check total interest calculations

### Continuous Validation
- Run full test suite on every simulation engine change
- Performance regression tests on large portfolios
- Accuracy spot-checks against external calculators

## Related Documentation
- CP-4: Forecast Engine V2 (implementation)
- CP-3: Bucket System (calculation foundation)
- CP-1: Clean Debt Model (input validation)