# PRD: Secure Debt Data + Analytics Integration

## Goal
Implement end-to-end secure handling of user debt data in TrySnowball:
- **Encryption at rest** in D1
- **De-identified analytics** in PostHog (EU region)
- **Consistent banding** for amounts, deltas, and portfolio totals
- **Minimal exposure** of creditor names and balances

This PRD describes required changes to Worker backend, D1 schema, client capture logic, and analytics toggles.

---

## Requirements

### 1. Encryption at Rest
- Sensitive fields (issuer name, exact balance, APR, notes) must be encrypted before writing to D1.
- Use AES-GCM via Cloudflare Web Crypto in Worker.
- Derive per-user encryption keys from a master key (`MASTER_KEY_V1` in env).
- Store `iv` and `ciphertext` in table.  
- Non-sensitive searchable fields (amount_band, debt_type, issuer_hash) stored in plaintext.

### 2. D1 Schema Changes
Add columns to `debts`:
```sql
ALTER TABLE debts ADD COLUMN dek_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE debts ADD COLUMN iv TEXT;
ALTER TABLE debts ADD COLUMN ciphertext TEXT;
ALTER TABLE debts ADD COLUMN amount_band TEXT;
ALTER TABLE debts ADD COLUMN issuer_hash TEXT;
```

Indices:
```sql
CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_type ON debts(user_id, debt_type);
CREATE INDEX IF NOT EXISTS idx_debts_user_amountband ON debts(user_id, amount_band);
```

### 3. Shared Amount Banding
Create `/src/shared/amountBands.ts` with:
- `bandAmount(minorUnits: number): AmountBandId`
- `bandDelta(deltaMinorUnits: number): DeltaBandId`
- `bandTotal(totalMinorUnits: number): AmountBandId`

Use the following bands (all amounts in pennies):
- "0-0", "0-500", "500-1k", "1-2k", "2-5k", "5-10k", "10-20k", "20-50k", "50k+"

### 4. Issuer Hashing
- Implement `issuerHash(env, issuer: string)` → returns HMAC-SHA256 hex
- Key: `METRICS_HMAC_KEY` in env
- Store in `issuer_hash` column
- Return `issuer_hash` in API responses for analytics capture
- Never send raw issuer names to PostHog

### 5. PostHog Analytics
- EU host: `https://eu.posthog.com`
- Opt-in toggle in Settings: "Help improve TrySnowball (share de-identified stats)"
- Disable autocapture and session recording
- Events:
  - `debt_added`: `{ amount_band, debt_type, issuer_hash, user_tier, country }`
  - `debt_updated`: `{ delta_band }`
  - `portfolio_snapshot`: `{ total_band, num_debts, mix }`

### 6. Client Code
- Init PostHog with opt-in only
- Capture events via helper functions in `analytics.ts`:
  - `captureDebtAdded()`
  - `captureDebtUpdated()`
  - `capturePortfolioSnapshot()`

### 7. Testing
- Unit tests for banding logic (vitest)
- Integration test: add a debt → verify DB row has ciphertext, not raw issuer
- Analytics payload inspection: confirm only bands + issuer_hash are sent

---

## Out of Scope
- Key rotation system (documented separately; can be added later)
- Migration of existing debts (fresh schema assumed)
- Advanced anonymisation (we only need bands + hash for now)

---

## Success Criteria
- No raw creditor names or exact balances in PostHog
- D1 rows contain ciphertext for sensitive fields
- Aggregated stats (bands) available for analytics and dashboards

---

## Implementation Order
1. **Backend First**
   - D1 schema migration
   - Encryption/decryption in Worker
   - API endpoints return encrypted data

2. **Shared Logic**
   - Amount banding functions
   - Issuer hashing utilities

3. **Frontend Integration**
   - Update debt storage to handle encrypted responses
   - Add analytics capture with bands only
   - Settings toggle for opt-in

4. **Testing & Validation**
   - Unit tests for all crypto operations
   - E2E test for full flow
   - Analytics payload verification

---

## Security Considerations
- Master key must be stored in Cloudflare secrets, never in code
- Per-user keys derived deterministically (no need to store)
- IV must be unique per encryption operation
- Failed decryption should fail gracefully with user notification