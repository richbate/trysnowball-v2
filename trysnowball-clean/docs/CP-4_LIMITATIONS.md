# CP-4 Known Limitations & Assumptions
**Status**: DOCUMENTED | **Review Date**: January 2025

## Technical Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| **Fixed APR** | No promotional rate expiry | Manual rate updates |
| **Proportional Minimums** | May not match issuer rules | Verify with provider |
| **Static Priority** | Priority doesn't adapt to changes | Review periodically |
| **Monthly Granularity** | No payment date logic | Use actual payment dates |
| **50-Year Cap** | Extreme scenarios truncated | Manual calculation |

## Model Assumptions

### Forecast Engine v1 (Flat)
- Single APR per debt
- Monthly compound interest
- Snowball targets lowest `order_index`
- Minimum payments applied first

### Forecast Engine v2 (Composite)
- APR rates remain constant throughout forecast
- Minimum payments split proportionally by balance
- No promotional rate expirations
- Snowball payments target highest priority buckets first
- Interest calculated independently per bucket

## Real-World Variations

### Credit Card Payment Allocation
- **Model**: Proportional by balance
- **Reality**: May target highest APR first (by law in some regions)

### Interest Calculation Methods  
- **Model**: Monthly compound (APR/12)
- **Reality**: Some use daily compound, others use different methods

### Minimum Payment Rules
- **Model**: Fixed percentage or amount
- **Reality**: May have floors, different calculation methods

### Promotional Rate Handling
- **Model**: Static APRs throughout simulation
- **Reality**: 0% rates expire and revert to standard rates

## User Experience Simplifications

- **Monthly granularity** vs daily payment processing
- **Perfect payment timing** vs real payment delays
- **No missed payments** vs reality of occasional misses
- **Unlimited overpayment** vs real cashflow constraints

## Disclosure Requirements
⚠️ Users must understand these are estimates based on assumptions that may not reflect their exact card terms or payment behavior.