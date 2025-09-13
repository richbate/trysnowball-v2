# CP-4 Calculation Functions & Issues Analysis

## Overview
Investigation into CP-4 Composite Forecast Engine calculation failures. Golden tests failing with precision errors and payment allocation mismatches.

## Key Functions in Calculation Pipeline

### 1. `round2dp(value: number): number`
**Location**: `src/utils/compositeSimulatorV2.ts:96`

**Purpose**: Round monetary values to 2 decimal places for UK currency standard

**Issues Found**:
- ✅ **FIXED**: Floating point precision causing 11.625 → 11.62 instead of expected 11.63
- **Original**: `parseFloat(value.toFixed(2))` - failed for edge cases
- **Fixed**: `Math.round(value * 100) / 100` - handles floating point correctly

**Test Case**: 
```javascript
balance: 500, apr: 27.9%
Expected interest: 11.63
Previous result: 11.62 (due to 11.624999999999998 rounding down)
Current result: 11.63 ✅
```

### 2. `applyPaymentToBuckets(buckets, minPayment, extraPayment)`
**Location**: `src/utils/compositeSimulatorV2.ts:197`

**Purpose**: Core payment allocation algorithm following CP-4 specification

**Current Implementation**:
1. Calculate interest for all buckets
2. Allocate minimum payment proportionally by balance 
3. Apply extra payment to highest priority bucket (lowest priority number)

**Issues Found**:
- ❌ **ACTIVE ISSUE**: Payment allocation doesn't match golden test expectations
- Algorithm produces different principal amounts than expected

**Expected vs Actual** (Single Debt - Multi-APR test):
```
Bucket b1 (Cash Advances, 500 balance, 27.9% APR, priority 1):
  Expected: payment 111.63, principal 100.00, interest 11.63
  Actual:   payment 128.30, principal 116.67, interest 11.63

Bucket b2 (Purchases, 1000 balance, 22.9% APR, priority 2):
  Expected: payment 69.08, principal 50.00, interest 19.08  
  Actual:   payment 52.41, principal 33.33, interest 19.08

Bucket b3 (Balance Transfer, 1500 balance, 0% APR, priority 3):
  Expected: payment 19.29, principal 19.29, interest 0.00
  Actual:   payment 50.00, principal 50.00, interest 0.00
```

### 3. `simulateCompositeSnowballPlan(debts, extraPerMonth, startDate)`
**Location**: `src/utils/compositeSimulatorV2.ts:296`

**Purpose**: Main simulation engine orchestrating monthly calculations

**Issues Found**:
- ❌ **PENDING**: Snowball rollover timing issue
  - Snowball pool applied in same month as debt payoff
  - Should apply in N+1 month, not month N
- ❌ **PENDING**: Missing snowball tracking properties in debt snapshots

### 4. `validateDebtsAndBuckets(debts: UKDebt[])`
**Location**: `src/utils/compositeSimulatorV2.ts:103`

**Purpose**: Input validation for debt and bucket data

**Current Status**: ✅ Working correctly - validation tests passing

## Root Cause Analysis

### Payment Allocation Algorithm Mismatch

The core issue appears to be misunderstanding the CP-4 payment allocation specification. 

**Current Understanding**:
- Minimum payment allocated proportionally by balance
- Extra payment goes to highest priority bucket

**Evidence from Test Fixtures**:
The expected values suggest a different algorithm. With 200 total payment (100 min + 100 extra):

```
Total available: 200
Total interest: 30.71 (11.63 + 19.08 + 0.00)
Total principal: 169.29 (100.00 + 50.00 + 19.29)
```

The principal distribution (100, 50, 19.29) doesn't follow proportional allocation:
- Proportional would be: ~56.43, 112.86, 0 (based on balance ratios)
- Priority-first would be: ~169.29, 0, 0 (all extra to highest priority)

**Hypothesis**: The algorithm might be:
1. Pay all interest charges first (30.71)
2. Distribute remaining payment (169.29) using a specific rule
3. Rule could be: minimum coverage for each bucket, then priority allocation

## Impact Assessment

### Golden Test Failures
- **Single Debt Multi-APR**: Payment allocation mismatch
- **Snowball Rollover**: Timing and tracking issues
- **Bucket Priority Order**: Payment distribution incorrect
- **Overpayment Scenarios**: Principal calculation errors

### Production Readiness Status
🚨 **CRITICAL**: CP-4 not production ready
- Core calculation engine producing incorrect results
- Golden tests failing with significant discrepancies
- Snowball rollover logic broken

## Next Steps

### Immediate Priorities
1. **Reverse Engineer Algorithm**: Analyze golden test fixture values to determine exact payment allocation logic
2. **Fix Snowball Timing**: Implement proper N+1 month rollover application  
3. **Update Payment Function**: Rewrite `applyPaymentToBuckets` to match expected behavior
4. **Validate All Tests**: Ensure all 12 golden test scenarios pass

### Investigation Questions
- What is the exact payment allocation algorithm for multi-APR buckets?
- How should minimum payments be distributed when buckets have different APRs?
- Should interest be paid first, then principal distributed?
- Are there issuer-specific rules that affect allocation?

### Code Quality Issues
- Function signature changed but not all call sites updated
- Complex payment logic needs better documentation
- Golden test expectations don't match documented algorithm

## Recommendation

**DO NOT DEPLOY CP-4** until:
1. Payment allocation algorithm matches golden test expectations exactly
2. Snowball rollover timing is corrected
3. All 12 golden test scenarios pass
4. Algorithm documentation updated to reflect actual implementation

The current implementation would produce incorrect debt payoff calculations for Pro tier users, potentially causing financial harm through inaccurate forecasts.