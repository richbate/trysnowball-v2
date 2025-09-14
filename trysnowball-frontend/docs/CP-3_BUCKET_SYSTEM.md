# CP-3: Multi-APR Bucket System

**Status**: ✅ Live  
**Last Updated**: 2024-09-11  
**Affects**: Debt simulation engine, payment calculations

## Purpose

Replaces the single-APR assumption of Forecast Engine V1 with accurate per-debt interest calculations, enabling precise simulations for mixed-rate debt portfolios.

## Core Concept

Each debt maintains its own "bucket" with individual APR, balance tracking, and payment allocation. No averaging or approximation - each debt calculates interest based on its actual rate.

## Bucket Structure

```typescript
interface DebtBucket {
  debt: CleanDebt           // Source debt information
  currentBalance: number    // Remaining balance
  monthlyInterestRate: number  // APR / 12
  totalInterestPaid: number    // Cumulative interest
  totalPrincipalPaid: number   // Cumulative principal
  payoffMonth?: number      // Month when balance reaches zero
}
```

## Payment Allocation Algorithm

1. **Initialize Buckets**: Create bucket for each debt with current balance
2. **Calculate Monthly Interest**: `balance * (apr / 12)` for each bucket
3. **Apply Minimum Payments**: Pay required minimums to each bucket
4. **Allocate Extra Payment**: Apply remaining payment based on strategy
5. **Update Balances**: Subtract payments, add interest for next cycle

## Strategy Implementation

### Snowball Strategy
```typescript
function allocateExtraPayment(buckets: DebtBucket[], extraAmount: number) {
  const sorted = buckets
    .filter(b => b.currentBalance > 0)
    .sort((a, b) => a.currentBalance - b.currentBalance)  // Smallest first
  
  // Apply extra payment to smallest debt
  if (sorted.length > 0) {
    sorted[0].applyPayment(extraAmount)
  }
}
```

### Avalanche Strategy  
```typescript
function allocateExtraPayment(buckets: DebtBucket[], extraAmount: number) {
  const sorted = buckets
    .filter(b => b.currentBalance > 0)
    .sort((a, b) => b.debt.apr - a.debt.apr)  // Highest APR first
  
  // Apply extra payment to highest APR debt
  if (sorted.length > 0) {
    sorted[0].applyPayment(extraAmount)
  }
}
```

## Precision Benefits

The bucket system eliminates the inaccuracies of V1:
- **Individual APR**: Each debt uses its actual rate (no averaging)
- **Compound Interest**: Monthly compounding calculated correctly per debt
- **Payment Timing**: Consistent application across all debts

## Example Calculation

For a portfolio with:
- Debt A: $5000 @ 25% APR
- Debt B: $3000 @ 12% APR  
- Extra payment: $200/month

**V1 (Deprecated)**: Would use average APR ~19.25% on both debts
**Bucket System**: Debt A pays 2.083% monthly, Debt B pays 1.0% monthly

This precision matters significantly for payoff timing and total interest.

## Performance Considerations

- **Memory**: O(n) buckets for n debts
- **Computation**: O(n) per simulation month
- **Storage**: Minimal - only track current state

## Related Documentation
- CP-1: Clean Debt Model
- CP-4: Forecast Engine V2 
- CP-3_LIMITATIONS: What bucket model cannot handle