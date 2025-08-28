# Debt Payoff Mathematical Analysis
## £35,698 Total Debt Scenario

### Current Debt Structure (from PlanOverview baseline data):
```
Paypal:      £1,400  @ 20% APR, £255 min payment
Flex:        £2,250  @ 20% APR, £70  min payment  
Barclaycard: £2,461  @ 20% APR, £75  min payment
Virgin:      £4,762  @ 20% APR, £255 min payment
MBNA:        £5,931  @ 20% APR, £255 min payment
Natwest:     £6,820  @ 20% APR, £70  min payment
Halifax 2:   £8,587  @ 20% APR, £215 min payment
Halifax 1:   £11,694 @ 20% APR, £300 min payment
--------------------------------
TOTAL:       £43,905 (Note: Your £35,698 suggests different balances)
Min Payments: £1,495/month
```

### Mathematical Formula for Debt Payoff

For each debt with balance B, interest rate r (monthly), and payment P:
- Monthly interest = B × (r/12)
- Principal payment = P - Monthly interest  
- New balance = B - Principal payment

### Snowball Method Calculation

**Payment Scenario 1: £1,941/month (£446 extra)**
```
Month 1:
- Total available: £1,941
- Pay minimums: £1,495
- Extra available: £446
- Target smallest debt (Paypal £1,400)
  - Interest: £1,400 × (20%/12) = £23.33
  - Principal from minimum: £255 - £23.33 = £231.67
  - Remaining balance: £1,400 - £231.67 = £1,168.33
  - Apply extra £446: £1,168.33 - £446 = £722.33

Month 2:
- Paypal balance: £722.33
- Interest: £722.33 × (20%/12) = £12.04
- Total payment to Paypal: £255 + £446 = £701
- Principal: £701 - £12.04 = £688.96  
- New balance: £722.33 - £688.96 = £33.37

Month 3:
- Paypal balance: £33.37
- Interest: £33.37 × (20%/12) = £0.56
- Payment needed: £33.37 + £0.56 = £33.93
- Paypal PAID OFF
- Remaining extra: £446 + (£255 - £33.93) = £667.07
- Apply to next smallest (Flex)
```

**Payment Scenario 2: £2,191/month (£696 extra)**
```
Month 1:
- Total available: £2,191  
- Pay minimums: £1,495
- Extra available: £696
- Target Paypal (£1,400)
  - Interest: £23.33
  - Principal from minimum: £231.67
  - Remaining: £1,168.33
  - Apply extra £696: £1,168.33 - £696 = £472.33

Month 2:
- Paypal balance: £472.33
- Interest: £7.87
- Total payment: £255 + £696 = £951
- Principal: £943.13
- Paypal PAID OFF (only needed £480.20)
- Remaining payment: £951 - £480.20= £470.80
- Apply to Flex
```

### Why No Date Change? Potential Issues:

1. **Rounding/Precision Issues**: The algorithm may have floating-point precision problems
2. **Chart Resolution**: Only showing 61 months, differences might be small
3. **Interest Calculation**: Using simple vs compound interest
4. **Debt Order**: If debts aren't properly sorted by balance
5. **Payment Application**: Extra payments not being applied correctly

### Expected Results for £35,698:

Assuming average 20% APR and £1,495 minimum payments:

**£1,941/month (£446 extra):**
- Payoff time: ~24-26 months
- Total interest: ~£5,200

**£2,191/month (£696 extra):** 
- Payoff time: ~21-23 months  
- Total interest: ~£4,400
- **Difference: 2-3 months faster**

### Debug the Issue:

The problem might be in the simulation loop where:
1. `totalMinPayments + currentExtraPayment` isn't updating properly
2. The `scenarios` useMemo isn't recalculating when payment changes
3. Chart data is cached and not refreshing

Let me examine the actual calculation code...