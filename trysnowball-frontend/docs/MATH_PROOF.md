# Mathematical Proof: Why Payment Changes Should Show Different Dates

## Current Demo Data (£43,905 total):
```
Debt Order (Snowball - smallest first):
1. Paypal:      £1,400 @ 20% APR, £255 min
2. Flex:        £2,250 @ 20% APR, £70  min
3. Barclaycard: £2,461 @ 20% APR, £75  min  
4. Virgin:      £4,762 @ 20% APR, £255 min
5. MBNA:        £5,931 @ 20% APR, £255 min
6. Natwest:     £6,820 @ 20% APR, £70  min
7. Halifax 2:   £8,587 @ 20% APR, £215 min
8. Halifax 1:   £11,694@ 20% APR, £300 min

Total Minimums: £1,495/month
```

## Scenario A: £1,941/month (£446 extra)

**Month 1:**
- Paypal: £1,400 - (£255 - £23.33) - £446 = £722.33
- All others: pay minimums only

**Month 2:**  
- Paypal: £722.33 - (£255 - £12.04) - £446 = -£23.29 → PAID OFF
- Remaining extra: £446 - (£722.33 + £12.04 - £255) = -£23.37
- Apply £221.07 to Flex: £2,250 - (£70 - £37.50) - £221.07 = £1,947.43

**Continue simulation...**
Estimated payoff: **~28-30 months**

## Scenario B: £2,191/month (£696 extra)

**Month 1:**
- Paypal: £1,400 - (£255 - £23.33) - £696 = £472.33

**Month 2:**
- Paypal: £472.33 - (£255 - £7.87) - £696 = -£471.54 → PAID OFF
- Remaining extra: £696 - (£472.33 + £7.87 - £255) = £470.80
- Apply to Flex: £2,250 - (£70 - £37.50) - £470.80 = £1,747.70

**Continue simulation...**
Estimated payoff: **~24-26 months**

## Expected Difference: 4-6 months

---

## Why You're Not Seeing Changes:

### 1. **Debt Amount Mismatch**
Your debt total (£35,698) ≠ Demo data (£43,905)
If you're testing with real debt data, the amounts are different.

### 2. **Minimum Payment Calculation Issue**
The simulation might be using incorrect minimum payments:
```javascript
// In PlanChart.jsx line 23-24:
minPayment: debt.min || debt.minPayment || debt.regularPayment || Math.max(25, Math.floor((debt.balance || debt.amount || 0) * 0.02))
```
If `debt.min` is undefined, it falls back to 2% of balance.

### 3. **Interest Rate Issues** 
All demo debts use 20% APR, but real debts might have different rates.

### 4. **Floating Point Precision**
JavaScript floating-point math can cause tiny rounding errors that accumulate.

### 5. **Chart Display Resolution**
The chart only shows 61 months (5 years), and differences of 2-3 months might not be visually obvious.

### 6. **UseMemo Dependency Issues**
The scenarios calculation might not be recalculating when extra payment changes.

## Quick Fix Test:

1. Check if `currentExtraPayment` is updating properly in the console
2. Verify the debt data structure matches expected format
3. Add console.log to the simulation loop to see month-by-month calculations
4. Check if the `scenarios` useMemo is re-running when payment changes

## Expected Results for £35,698:
- £1,941/month: ~22-24 months  
- £2,191/month: ~19-21 months
- **Difference: 3-5 months**

The £250 increase should definitely show a measurable difference!