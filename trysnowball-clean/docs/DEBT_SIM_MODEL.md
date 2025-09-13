# Debt Simulation Model v2: Multi-APR Bucket System

## 1. Canonical Schema

### Input: DebtBucket
```typescript
interface DebtBucket {
  id: string;              // Unique identifier
  name: string;            // "Purchases", "Cash Advances", "Balance Transfer"
  balance: number;         // Current balance in pounds (£)
  apr: number;             // Annual Percentage Rate (0-100%)
  payment_priority: number; // 1 = highest priority (paid first)
}
```

### Input: CompositeDe bt
```typescript
interface CompositeDebt extends UKDebt {
  buckets: DebtBucket[];   // Must sum to debt.amount
}
```

### Acceptable Edge Cases
- Empty buckets (balance = 0): Skip interest calculation, no payments allocated
- Single bucket: Behaves like single APR debt
- Overpayment: Clears bucket, spills to next priority bucket
- Zero minimum payment: Still applies snowball to highest priority

## 2. Core Logic Rules

### Interest Accrual (Monthly)
```
bucket_interest = ROUND(bucket.balance * (bucket.apr / 100 / 12), 2)
total_debt_interest = SUM(all bucket_interest)
```

### Payment Allocation Priority
1. **Minimum Payment Distribution**
   - Allocate proportionally by balance: `bucket_min = (bucket.balance / total_balance) * debt.min_payment`
   - Apply to highest priority first until interest + allocation covered
   - Remainder goes to next priority bucket

2. **Extra Payment (Snowball) Allocation**
   - Target: Lowest `payment_priority` number (1 = highest)
   - Apply entire extra amount to single target bucket
   - If target bucket cleared, remainder goes to next priority bucket

### Rounding Rules
- Interest: Round to pence (2 decimal places)
- Payments: Round to pence
- Balances: Round to pence after each transaction

### Payment Order Within Month
1. Add interest to all buckets
2. Apply minimum payment allocation (by priority)
3. Apply extra payment (snowball) to highest priority unpaid bucket
4. Update balances and check for bucket completion

## 3. State Transitions

### Bucket Cleared Condition
```
bucket.isPaidOff = (bucket.balance <= 0.01) // 1p tolerance
```

### Snowball Rollover
When debt fully paid:
```
snowball_pool += debt.min_payment  // Add to next debt's extra
```

### APR Expiry (Future Enhancement)
```
// Not implemented in v2.0 - buckets maintain fixed APR
// Future: bucket.expiry_date triggers APR change
```

## 4. UK Credit Card Realistic Model

### Typical Priority Order (by APR)
1. **Cash Advances** (27-29% APR) - Highest priority
2. **Purchases** (22-25% APR) - Medium priority  
3. **Balance Transfers** (0-3% APR) - Lowest priority

### Example: Barclaycard Platinum
```typescript
{
  name: "Barclaycard Platinum",
  amount: 3000,
  min_payment: 75, // 2.5% of balance
  buckets: [
    {
      name: "Purchases",
      balance: 2000,
      apr: 22.9,
      payment_priority: 2
    },
    {
      name: "Cash Advances", 
      balance: 500,
      apr: 27.9,
      payment_priority: 1  // Paid first
    },
    {
      name: "Balance Transfer",
      balance: 500,
      apr: 0,    // 0% for 20 months
      payment_priority: 3  // Paid last
    }
  ]
}
```

## 5. Expected Behavior

### Month 1 with £100 extra payment:
1. **Interest**: Purchases: £38.17, Cash: £11.63, BT: £0 = £49.80 total
2. **Minimum allocation**: 75 * (2000/3000) = £50 to Purchases, £12.50 to Cash, £12.50 to BT
3. **Extra targeting**: All £100 goes to Cash Advances (priority 1)
4. **Result**: Cash balance reduced by £112.50 - £11.63 = £100.87

### Expected Differences vs Single APR:
- Single APR (weighted): ~18.6% would show £46.50 monthly interest
- Multi-bucket: £49.80 monthly interest (higher due to cash advance APR)
- Payoff time: Multi-bucket clears high APR first (faster overall payoff)

## 6. Validation Rules

### Data Consistency
- `SUM(bucket.balance) == debt.amount` (within 1p tolerance)
- Each bucket has unique `payment_priority` (1, 2, 3...)
- All APRs are valid (0-100%)

### Mathematical Accuracy
- Total interest = sum of bucket interests
- Payment allocation respects minimum payment constraint
- Snowball targeting follows strict priority order
- Bucket completion triggers correctly (balance <= 0.01)

## 7. Known Limitations (v2.0)

- **Fixed APR**: No promotional rate expiry
- **Static Priority**: Priority doesn't change based on balance
- **No Minimum Variance**: All buckets use same minimum payment split
- **No Payment Date Logic**: Assumes monthly payments on fixed schedule

## 8. Success Criteria

A correct implementation must:
1. ✅ Calculate interest per bucket accurately
2. ✅ Allocate minimum payments proportionally  
3. ✅ Apply snowball to highest priority bucket only
4. ✅ Clear buckets in priority order
5. ✅ Show meaningful difference vs single APR forecast
6. ✅ Handle edge cases (overpayment, zero balances) gracefully

---

**Model Status**: 🔒 LOCKED
**Next Step**: Golden test fixtures based on this model
**Blocker**: Any deviation from this model requires re-review