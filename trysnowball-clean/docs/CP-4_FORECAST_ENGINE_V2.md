# CP-4 Forecast Engine v2.0 (Composite Buckets)
**Status**: ✅ OPERATIONAL | **Engine**: `compositeBucketEngine.ts`

## DebtBucket Schema
```typescript
interface DebtBucket {
  id: string;              // Unique identifier
  name: string;            // Display name
  balance: number;         // Current balance in pounds
  apr: number;             // APR for this bucket (0-100%)
  payment_priority: number; // 1 = highest priority
}
```

## Core Algorithm Rules

### 1. Interest Calculation (Per Bucket)
```javascript
bucket_interest = ROUND(bucket.balance * (bucket.apr / 100 / 12), 2)
total_debt_interest = SUM(all bucket_interest)
```

### 2. Payment Allocation Steps
1. **Add interest** to all buckets
2. **Allocate minimum payment** proportionally by balance
3. **Apply minimum payments** to reduce balances
4. **Apply snowball** to highest priority unpaid bucket (lowest priority number)

### 3. Priority System
- `payment_priority: 1` = highest priority (paid first)
- `payment_priority: 2` = second priority
- Cash advances typically priority 1 (highest APR)
- Balance transfers typically priority 3 (lowest APR)

## Example Simulation
**Barclaycard**: £3000 total, £75 minimum, £100 extra
- Purchases: £2000 @ 22.9% (priority 2)
- Cash Advances: £500 @ 27.9% (priority 1) ← Gets snowball first
- Balance Transfer: £500 @ 0% (priority 3)

**Month 1 Result**:
- Cash Advances: £500 → £399 (gets all £100 extra)
- Purchases: £2000 → £1988 (minimum only)
- Balance Transfer: £500 → £487 (minimum only)

## Validation Rules
- `SUM(bucket.balance) == debt.amount` (±1p tolerance)
- Unique payment priorities per debt
- All APRs 0-100%
- Maximum 10 buckets per debt

## Assumptions & Limitations
⚠️ **Fixed APRs**: No promotional rate expiry
⚠️ **Proportional Minimums**: May not match issuer rules
⚠️ **Static Priority**: Doesn't adapt to balance changes
⚠️ **Monthly Granularity**: No payment date logic