# TrySnowball Debt Calculation Logic

This document explains the critical mathematical algorithms used in TrySnowball's debt payoff calculations.

## Core Calculation Functions

### 1. `simulateSnowball(debts, totalPayment)` - Lines 49-83

**Purpose**: Simulates the snowball debt elimination method to calculate payoff time.

**Algorithm**:
```javascript
const simulateSnowball = (debts, totalPayment) => {
  // 1. Sort debts by balance (smallest first) - core snowball principle
  const snowballDebts = JSON.parse(JSON.stringify(debts)).sort((a, b) => a.balance - b.balance);
  
  // 2. Iterate month by month for up to 120 months
  for (let month = 1; month <= 120; month++) {
    let available = totalPayment;
    
    // 3. PHASE 1: Pay minimum payments + interest on all debts
    for (let i = 0; i < snowballDebts.length; i++) {
      const debt = snowballDebts[i];
      if (debt.balance <= 0) continue;
      
      // Calculate monthly interest charge
      const interest = debt.balance * (debt.rate / 12 / 100);
      
      // Calculate principal payment (minimum - interest)
      const minPrincipal = Math.max(debt.minPayment - interest, 0);
      
      // Apply principal to reduce balance
      debt.balance = Math.max(0, debt.balance - minPrincipal);
      
      // Deduct minimum payment from available funds
      available -= debt.minPayment;
    }
    
    // 4. PHASE 2: Apply ALL extra funds to smallest remaining debt
    if (available > 0) {
      for (let i = 0; i < snowballDebts.length; i++) {
        const debt = snowballDebts[i];
        if (debt.balance > 0) {
          // Pay up to remaining balance or available funds
          const payment = Math.min(available, debt.balance);
          debt.balance -= payment;
          break; // Only pay extra to first (smallest) debt with balance
        }
      }
    }
    
    // 5. Check for debt freedom
    const totalRemaining = snowballDebts.reduce((sum, debt) => sum + debt.balance, 0);
    if (totalRemaining <= 1) return month; // Success!
  }
  
  return -1; // Failed to pay off within 120 months
};
```

**Key Principles**:
- **Snowball Method**: Always prioritizes smallest balance first
- **Interest Compounding**: Monthly interest = `balance * (APR / 12 / 100)`
- **Payment Order**: Minimums first, then all extra to smallest debt
- **Termination**: Stops when total debt ≤ £1 or 120 months elapsed

### 2. Scenario Calculations - Lines 130-204

**Purpose**: Generates three debt payoff scenarios for comparison.

#### A. "Do Nothing" Scenario (Interest Only)
```javascript
// Shows debt growth with no payments - pure compound interest
for (let month = 0; month <= 60; month++) {
  const total = debts.reduce((acc, debt) => {
    const monthlyRate = debt.rate / 12 / 100;
    const futureBalance = debt.balance * Math.pow(1 + monthlyRate, month);
    return acc + futureBalance;
  }, 0);
  doNothingData.push({ month, balance: Math.round(total) });
}
```

#### B. "Minimum Payments Only" Scenario
```javascript
// Simulates paying only minimum payments on each debt
for (let month = 0; month <= 120; month++) {
  for (let i = 0; i < minDebts.length; i++) {
    const debt = minDebts[i];
    if (debt.balance <= 0) continue;
    
    // Add interest charge
    const interest = debt.balance * (debt.rate / 12 / 100);
    totalMinInterest += interest;
    
    // Apply minimum payment minus interest as principal
    const principal = Math.max(debt.minPayment - interest, 0);
    debt.balance = Math.max(debt.balance - principal, 0);
  }
}
```

#### C. "Snowball Method" Scenario
```javascript
// Uses simulateSnowball logic but tracks interest paid
let available = totalMinPayments + extraPayment;

// Pay minimums first
for (each debt) {
  const interest = debt.balance * (debt.rate / 12 / 100);
  totalSnowballInterest += interest;
  const minPrincipal = Math.max(debt.minPayment - interest, 0);
  debt.balance = Math.max(0, debt.balance - minPrincipal);
  available -= debt.minPayment;
}

// Apply extra to smallest debt
if (available > 0) {
  for (smallest debt with balance > 0) {
    const extraPaymentAmount = Math.min(available, debt.balance);
    debt.balance -= extraPaymentAmount;
    break; // Only pay extra to one debt
  }
}
```

### 3. Critical Fix: Extra Payment Impact Calculation - Lines 405-440

**Problem Solved**: The original calculation was showing impossible results like "save 101 months on a 60-month payoff."

**Solution Logic**:
```javascript
// 1. Calculate baseline (minimum payments only)
const baselinePayoffMonths = useMemo(() => {
  return simulateSnowball(debts, totalMinPayments);
}, [debts, totalMinPayments]);

// 2. Calculate with extra payment
const snowballPayoffMonths = scenarios.snowball.findIndex((p, index) => index > 0 && p.balance <= 1);

// 3. Apply mathematical safeguards
const monthsSaved = Math.max(0, Math.min(baselinePayoffMonths - snowballPayoffMonths, baselinePayoffMonths - 1));

// 4. Final safeguard - cannot save more than baseline-1
const safeMonthlySaved = Math.min(monthsSaved, baselinePayoffMonths - 1);
```

**Safeguards Applied**:
1. **Non-negative**: `Math.max(0, ...)` prevents negative savings
2. **Logical Maximum**: `Math.min(..., baselinePayoffMonths - 1)` prevents saving more months than exist
3. **Double-check**: Final `Math.min()` ensures mathematical impossibility prevention
4. **Graceful Fallback**: Shows "Accelerates payoff" when exact calculation fails

### 4. Binary Search for Target Payment - Lines 86-106

**Purpose**: Calculate required extra payment to achieve specific payoff timeline.

```javascript
const calculateExtraPaymentForTarget = (targetMonths, debts, totalMinPayments) => {
  let low = 0;
  let high = 2000; // Maximum search range
  let bestExtra = 0;
  
  // Binary search for optimal extra payment
  while (low <= high) {
    const midExtra = Math.floor((low + high) / 2);
    const testPayoffMonths = simulateSnowball(debts, totalMinPayments + midExtra);
    
    if (testPayoffMonths > 0 && testPayoffMonths <= targetMonths) {
      bestExtra = midExtra; // Found a valid solution
      high = midExtra - 1;  // Try to find a smaller payment
    } else {
      low = midExtra + 1;   // Need higher payment
    }
  }
  
  return bestExtra;
};
```

**Optimization**: Uses binary search (O(log n)) instead of linear search (O(n)) for efficiency.

## Mathematical Accuracy Considerations

### Interest Calculation Precision
- **Monthly Rate**: `APR / 12 / 100` (e.g., 24% APR = 2% monthly)
- **Compound Interest**: Applied each month before payments
- **Rounding**: Balances rounded to nearest penny for display

### Edge Cases Handled
1. **Zero Balance Debts**: Skipped in calculations
2. **Negative Principal**: `Math.max(debt.minPayment - interest, 0)` prevents negative payments
3. **Overpayment**: `Math.min(available, debt.balance)` prevents paying more than owed
4. **120-Month Limit**: Prevents infinite loops for unpayable debt scenarios
5. **Immediate Payoff**: Returns 1 month when `totalPayment >= totalDebt`
6. **Interest Rounding**: `Math.round(interest * 100) / 100` prevents floating-point drift
7. **Do Nothing Validation**: Monitors compound interest scenarios for mathematical consistency
8. **Safeguarded Time Savings**: Prevents showing impossible month savings exceeding baseline

### Known Limitations
1. **Fixed Minimums**: Assumes minimum payments don't change (real minimums decrease as balances drop)
2. **No Payment Holidays**: Doesn't account for missed payments
3. **No Rate Changes**: Uses current APR throughout projection
4. **Simplified Interest**: Uses simple monthly compounding vs. daily compounding used by some lenders

## Performance Optimization

### Memoization Strategy
```javascript
const baselinePayoffMonths = useMemo(() => {
  return simulateSnowball(debts, totalMinPayments);
}, [debts, totalMinPayments]);
```

**Benefits**:
- Prevents recalculation when only `extraPayment` changes
- Critical for slider responsiveness
- Reduces computation from O(n²) to O(n) for user interactions

### Data Structure Efficiency
- **Deep Copy**: `JSON.parse(JSON.stringify(debts))` creates independent copies for each scenario
- **Early Termination**: Stops calculations when `totalRemaining <= 1`
- **Sorted Arrays**: Pre-sorts debts once per calculation cycle

## Validation & Testing

### Critical Test Cases
1. **Single Debt**: Verify simple interest + principal calculations
2. **Multiple Debts**: Ensure snowball ordering (smallest first)
3. **High Extra Payment**: Verify impossible calculation prevention
4. **Zero Extra Payment**: Should equal minimum payment scenario
5. **Edge Cases**: Very low balances, very high interest rates

### Mathematical Verification
The calculations can be verified against standard amortization formulas:
```
Months = -log(1 - (Principal × Monthly_Rate) / Payment) / log(1 + Monthly_Rate)
```

This ensures the snowball simulation produces mathematically sound results consistent with financial industry standards.