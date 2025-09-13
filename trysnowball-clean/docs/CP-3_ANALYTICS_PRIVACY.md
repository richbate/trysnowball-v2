# CP-3 Analytics Privacy Rules

## Purpose
Define exactly what metadata can be logged or stored for analytics, to preserve user privacy while enabling insight.

---

## Principles
1. **No raw values in analytics**: amounts, APRs, and debt names are always encrypted at rest and never logged directly.
2. **Only bucketed ranges allowed**: analytics may use safe categorical ranges (amount, APR, burden).
3. **Frontend events must sanitize**: all events sent to PostHog must use derived/bucketed values only.
4. **Worker must store only safe metadata**: D1 columns may include pre-aggregated buckets for queries, never raw values.

---

## Allowed Metadata

### Amount Buckets
- `under_1k`  
- `1k_5k`  
- `5k_10k`  
- `10k_plus`

### APR Buckets
- `low_0_10`  
- `medium_10_20`  
- `high_20_plus`

### Payment Burden
(min_payment ÷ amount)
- `light` (<2%)  
- `moderate` (2–4%)  
- `heavy` (>4%)

### Categories
- `credit_card`  
- `loan`  
- `mortgage`  
- `other`

### Timestamps
- `created_month` (YYYY-MM)  
- `payoff_quarter` (YYYY-Q#)  

---

## Analytics Events (PostHog)

Example safe payload:

```json
{
  "event": "debt_created",
  "properties": {
    "amount_range": "1k_5k",
    "apr_range": "medium_10_20",
    "payment_burden": "moderate",
    "category": "credit_card",
    "created_month": "2025-09"
  }
}