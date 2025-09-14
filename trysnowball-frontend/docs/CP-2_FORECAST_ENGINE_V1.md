# CP-2: Forecast Engine V1 (Legacy)

**Status**: ☠️ Deprecated  
**Last Updated**: 2024-09-11  
**Affects**: Legacy simulation code (being replaced by CP-4)

## Purpose

Documents the original single-APR debt payoff simulation engine. This system is deprecated and being replaced by the Bucket System (CP-3) and Forecast Engine V2 (CP-4).

## Original Design

The V1 engine made several simplifying assumptions:
- Single representative APR across all debts
- Linear interest calculations
- Fixed payment allocation strategies

## Key Limitations (Why It Was Replaced)

1. **Single APR Assumption**: Applied average APR to all debts, losing precision for mixed-rate portfolios
2. **Compound Interest**: Used simple interest approximation instead of true compound calculations
3. **Payment Timing**: Assumed all payments made on same day of month
4. **Strategy Flexibility**: Limited to pure snowball or avalanche, no custom ordering

## Algorithm Overview

```javascript
// Simplified V1 algorithm (DEPRECATED)
function simulatePayoffV1(debts, strategy, extraPayment) {
  const avgAPR = calculateAverageAPR(debts)
  const sortedDebts = sortByStrategy(debts, strategy)
  
  // Apply average APR to all debts (PROBLEMATIC)
  return processPayments(sortedDebts, avgAPR, extraPayment)
}
```

## Migration Path

V1 code is being systematically replaced with:
- **CP-3**: Bucket System for multi-APR accuracy
- **CP-4**: Forecast Engine V2 with proper compound interest

## Historical Context

This engine served the system well for initial development but proved inadequate for:
- High-APR credit cards mixed with low-APR loans
- Precise payment timing calculations
- Custom debt prioritization strategies

## Related Documentation
- CP-3: Bucket System (replacement)
- CP-4: Forecast Engine V2 (current implementation)