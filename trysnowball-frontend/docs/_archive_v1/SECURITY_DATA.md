# Security & Data Handling in TrySnowball

This document explains how we secure debt data, how we handle PII in analytics, and how we track user debts.

---

## Authentication Flow

TrySnowball uses a secure JWT-based authentication system with automatic token refresh and zero-trust validation.

- **JWT Storage**: Tokens stored in localStorage as `ts_jwt` key
- **Token Lifetime**: 14 days with automatic refresh 24h before expiry
- **Background Refresh**: Seamless token renewal without user interaction
- **Session Monitoring**: Full expiry warning modal alerts users <24h remaining
- **Zero-Trust**: Every API request validated on Cloudflare edge with JWT verification
- **User Isolation**: All data scoped by `user_id` extracted from validated JWT payload
- **Secure Logout**: Manual logout clears all token traces from localStorage and sessionStorage
- **Fallback Handling**: Graceful zombie session detection and recovery flows

## Encryption at Rest

All sensitive user debt data is encrypted before being stored in the D1 database.

- **Algorithm**: AES-256-GCM via Cloudflare Web Crypto
- **Per-user keys**: Derived from a master key (`MASTER_KEY_V1`) using HMAC/HKDF
- **Fields encrypted**:
  - Creditor / issuer name
  - Exact balance (in pennies)
  - APR / interest rate
  - Free-text notes
- **Fields in plaintext** (safe for queries and analytics):
  - `user_id`
  - `debt_type` (credit_card, loan, overdraft, bnpl, other)
  - `amount_band` (categorical bucket)
  - `issuer_hash` (HMAC'd issuer name, not reversible)
  - `created_at`, `updated_at`

A D1 row looks like:
```sql
id TEXT PRIMARY KEY
user_id TEXT
dek_version INTEGER
iv TEXT
ciphertext TEXT
debt_type TEXT
amount_band TEXT
issuer_hash TEXT
created_at INTEGER
updated_at INTEGER
```

If the DB is leaked, it contains only ciphertext and hashed identifiers.

---

## PII in Analytics

We use PostHog (EU region only) for product analytics.  
**We do not send raw creditor names or exact balances.**

### Rules
- No raw PII (issuer names, account numbers, balances, APRs)
- Only bands + hashes are allowed
- Opt-in only (user can toggle sharing de-identified stats in Settings)

### Events

#### 1. `debt_added`
```json
{
  "amount_band": "2-5k",
  "debt_type": "credit_card",
  "issuer_hash": "e7b8a4...",
  "user_tier": "free",
  "country": "GB"
}
```

#### 2. `debt_updated`
```json
{ "delta_band": "-500" }
```

#### 3. `portfolio_snapshot`
```json
{
  "total_band": "10-20k",
  "num_debts": 4,
  "mix": { "credit_card": 3, "loan": 1 }
}
```

These give us insight into overall debt tracking without exposing individual user details.

---

## Tracking User Debts

- Exact values are encrypted and only visible to the logged-in user
- Aggregated bands (e.g. £2–5k) are used for analytics and reporting
- `issuer_hash` allows deduplication and market share stats without storing the actual names

### Example

A user adds:
- Barclaycard, £3,250 @ 29%

**We store in D1:**
- `ciphertext`: `{ issuer:"Barclaycard", amount_cents:325000, apr_bps:2900 }`
- `amount_band`: "2-5k"
- `issuer_hash`: "ab43f09d..."

**We send to PostHog:**
- `{ amount_band:"2-5k", debt_type:"credit_card", issuer_hash:"ab43f09d..." }`

---

## Why This Matters

- **Security**: If D1 is leaked, attackers see ciphertext and hashes only
- **Ethics & GDPR**: No raw PII in third-party systems; all analytics data is de-identified and aggregated
- **Business Value**: We can still measure:
  - How much total debt we're tracking (in bands)
  - What types of debt are most common
  - Which issuers dominate (via hash counts)

---

## Implementation Status

- [ ] D1 schema with encryption columns
- [ ] Worker-side encryption/decryption
- [ ] Amount banding utilities
- [ ] Issuer hashing with HMAC
- [ ] PostHog EU integration
- [ ] Analytics opt-in toggle
- [ ] Client-side de-identified capture

---

## Compliance Checklist

- [x] Data minimization (only collect what's needed)
- [x] Purpose limitation (clear use cases documented)
- [ ] Encryption at rest (AES-256-GCM)
- [ ] De-identified analytics (bands + hashes only)
- [ ] User control (opt-in toggle)
- [ ] EU data residency (PostHog EU)
- [ ] Audit trail (all operations logged)