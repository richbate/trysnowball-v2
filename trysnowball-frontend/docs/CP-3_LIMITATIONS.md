# CP-3: Bucket System Limitations

**Status**: ✅ Live  
**Last Updated**: 2024-09-11  
**Affects**: System expectations, feature planning

## Purpose

Documents what the Multi-APR Bucket System does NOT handle, setting clear expectations for system capabilities and future development.

## Payment Timing Limitations

### Monthly Payment Assumption
- **Assumes**: All payments made on same day each month
- **Reality**: Users may pay on different dates, multiple times per month
- **Impact**: Interest calculations slightly inaccurate for mid-month payments

### Fixed Payment Dates
- **Assumes**: Payments occur on first of each month for calculation purposes
- **Reality**: Due dates vary (15th, 30th, etc.)
- **Impact**: Minor variance in interest accumulation

## Strategy Limitations

### Binary Strategy Application
- **Current**: Pure snowball OR pure avalanche
- **Missing**: Hybrid strategies (e.g., "snowball until debt X is gone, then avalanche")
- **Workaround**: Manual debt reordering by user

### No Debt Consolidation Modeling
- **Missing**: Cannot simulate balance transfers or loan consolidation
- **Missing**: Cannot model promotional APR periods (0% for 12 months)
- **Missing**: Cannot account for balance transfer fees

## Financial Reality Gaps

### Income Variability
- **Assumes**: Fixed extra payment amount each month
- **Reality**: Income fluctuates, extra payments vary
- **Impact**: Timeline projections may be overly optimistic

### Emergency Fund Impact
- **Missing**: No modeling of emergency fund depletion
- **Missing**: No accounting for other financial priorities
- **Missing**: No cash flow analysis

### Fees and Penalties
- **Missing**: Late payment fees
- **Missing**: Over-limit fees  
- **Missing**: Annual fees
- **Impact**: Total cost underestimated

## Mathematical Simplifications

### Interest Compounding
- **Current**: Monthly compounding
- **Reality**: Some cards compound daily
- **Impact**: Small underestimate of interest charges

### Minimum Payment Calculation
- **Assumes**: Fixed minimum payment amounts
- **Reality**: Minimums often calculated as percentage of balance
- **Impact**: Extended payoff times as balances decrease

## User Behavior Assumptions

### Payment Discipline
- **Assumes**: Users make planned payments consistently
- **Reality**: Payment discipline varies significantly
- **Missing**: Behavioral modeling or motivation tracking

### No New Debt
- **Assumes**: Users don't add new debt during payoff period
- **Reality**: Many users continue using credit cards
- **Impact**: Projections become invalid if new debt added

## Technical Constraints

### Calculation Horizon
- **Limit**: Simulations capped at reasonable timeframe (10+ years)
- **Issue**: Very low payment scenarios may exceed calculation limits

### Precision Limits
- **JavaScript Numbers**: Limited precision for very large debt amounts
- **Rounding**: Monthly calculations rounded to nearest cent

## Future Enhancement Areas

1. **Variable Payments**: Allow month-by-month payment customization
2. **Consolidation Modeling**: Balance transfer and refinancing scenarios
3. **Behavioral Factors**: Success probability based on user patterns
4. **Fee Integration**: Account for common fees and penalties
5. **Income-Based Planning**: Link payments to projected income changes

## Related Documentation
- CP-3: Bucket System (core implementation)
- CP-4: Forecast Engine V2
- CP-5: Goals Engine (planned enhancements)