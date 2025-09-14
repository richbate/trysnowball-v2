# 🔐 Secure Debt Encryption - Production Deployment Checklist

**CRITICAL**: This deploys bank-level encryption for user debt data. Follow each step carefully.

## Pre-Deployment Security Checklist

### Environment Variables & Secrets
- [ ] **Generate Master Encryption Key**
  ```bash
  # Generate 256-bit key (NEVER commit this!)
  openssl rand -base64 32
  ```
- [ ] **Set production secrets** (DO NOT commit these values)
  ```bash
  wrangler secret put MASTER_KEY_V1 --config wrangler-debts.toml --env production
  wrangler secret put METRICS_HMAC_KEY --config wrangler-debts.toml --env production
  wrangler secret put JWT_SECRET --config wrangler-debts.toml --env production
  ```
- [ ] **Verify PostHog EU region**
  ```bash
  # Confirm in src/lib/posthog.js
  grep "eu.posthog.com" src/lib/posthog.js
  ```
- [ ] **Confirm analytics opt-in defaults to FALSE**
  ```bash
  # Check src/utils/secureAnalytics.ts
  grep "false" src/utils/secureAnalytics.ts
  ```

### Database Migration
- [ ] **Backup production D1 database**
  ```bash
  npx wrangler d1 backup create auth_db --remote
  ```
- [ ] **Apply secure debts migration**
  ```bash
  npx wrangler d1 execute auth_db --remote --file=migrations/002_secure_debts.sql
  ```
- [ ] **Verify new schema**
  ```bash
  npx wrangler d1 execute auth_db --remote --command=".schema debts"
  ```

### Legacy Data Decision Point
**⚠️ CRITICAL DECISION**: Handle existing production debts

**Option A: Clean Slate (Recommended for MVP)**
- [ ] Export existing user debts for backup
- [ ] Clear production debts table
- [ ] Users re-enter debts (encrypted from day one)

**Option B: Encrypt-in-Place (Complex)**
- [ ] Write one-time migration script to encrypt existing debts
- [ ] Test thoroughly on staging copy first
- [ ] Run during maintenance window

**Decision Made**: [ ] Option A [ ] Option B

## Deployment Steps

### 1. Deploy Secure Debts Worker
- [ ] **Deploy to staging first**
  ```bash
  ./deploy-secure-debts.sh --env staging
  ```
- [ ] **Test staging deployment** (see testing section below)
- [ ] **Deploy to production**
  ```bash
  ./deploy-secure-debts.sh --env production
  ```
- [ ] **Verify production worker is live**
  ```bash
  curl https://trysnowball.co.uk/api/debts -H "Authorization: Bearer [JWT]"
  ```

### 2. Frontend Integration
- [ ] **Update API endpoints** in frontend to use secure API
- [ ] **Deploy frontend** with secure analytics integration
- [ ] **Verify frontend connects** to encrypted API

### 3. Production Sanity Checks
- [ ] **Insert test debt via API**
  ```bash
  curl -X POST https://trysnowball.co.uk/api/debts \
    -H "Authorization: Bearer [JWT]" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Card","balance":1500,"interestRate":23.99,"minPayment":50}'
  ```
- [ ] **Verify ciphertext in database**
  ```bash
  npx wrangler d1 execute auth_db --remote \
    --command="SELECT amount_band, issuer_hash, length(ciphertext) FROM debts LIMIT 1;"
  ```
- [ ] **Check PostHog event** (should show only bands/hashes, no raw data)
- [ ] **Test debt retrieval** (should decrypt correctly)
- [ ] **Clean up test debt**

## Post-Deployment Testing

### End-to-End Flow Testing
- [ ] **Create new user account**
- [ ] **Add debt** → Verify encrypted in DB
- [ ] **Edit debt** → Verify re-encrypted with new data
- [ ] **Delete debt** → Verify removed from DB
- [ ] **Check PostHog events** → Only bands/hashes logged

### Analytics Opt-Out Testing
- [ ] **User opts out** of analytics
- [ ] **Perform debt operations** → Verify NO PostHog events
- [ ] **User opts back in** → Verify events resume

### Multi-User Isolation Testing
- [ ] **Create two test users** (User A, User B)
- [ ] **User A adds debt** → Note ciphertext
- [ ] **Attempt to decrypt User A's debt with User B's key** → Should fail
- [ ] **Verify error handling** for decryption failures

### Performance & Security Validation
- [ ] **Check response times** (should be <200ms for single debt)
- [ ] **Monitor Worker logs** for any plaintext leakage
- [ ] **Verify audit logs** show decryption events (but not data)
- [ ] **Test key version handling** (all new debts use v1)

## Operational Runbooks

### Key Rotation Procedure (Future)
**Trigger**: Annual rotation or security incident

1. **Generate new key**
   ```bash
   openssl rand -base64 32  # This becomes MASTER_KEY_V2
   ```
2. **Update worker secrets**
   ```bash
   wrangler secret put MASTER_KEY_V2 --env production
   ```
3. **Update crypto-utils.js** to recognize V2 keys
4. **Deploy updated worker** (supports both V1 and V2)
5. **Background re-encryption** (lazy or batch)
6. **Retire V1 key** after all data migrated

### Incident Response
**If encryption keys compromised:**
- [ ] **Immediately rotate keys** (follow key rotation above)
- [ ] **Audit access logs** for unauthorized decryption
- [ ] **Re-encrypt all affected data**
- [ ] **Notify users** if required by regulations

### Monitoring & Alerts
- [ ] **Set up alerts** for:
  - High decryption failure rate (>5%)
  - Unusual access patterns
  - PostHog receiving raw data (should never happen)
- [ ] **Weekly review** of:
  - Encryption performance metrics
  - Analytics data quality
  - User opt-in/opt-out trends

## Success Criteria

### Technical Validation
- [ ] ✅ All new debts encrypted at rest in D1
- [ ] ✅ PostHog receives only de-identified data
- [ ] ✅ User opt-in flow working
- [ ] ✅ Cross-user data isolation confirmed
- [ ] ✅ Performance meets requirements (<200ms)

### Business Validation
- [ ] ✅ Users can successfully manage debts
- [ ] ✅ Analytics insights still actionable with bands
- [ ] ✅ No customer-reported data issues
- [ ] ✅ Compliance requirements met

## 🎉 Go-Live Announcement

**When all checkboxes complete:**

> 📢 **TrySnowball Security Update**
> 
> We've implemented bank-level security for your debt data:
> 
> ✅ **Full encryption at rest** - Your debt amounts and creditor names are encrypted with military-grade AES-256-GCM
> 
> ✅ **Privacy-first analytics** - We only see anonymized bands (e.g. "£2k-5k") never your exact amounts
> 
> ✅ **GDPR compliant** - Data stored in EU, full user control, opt-in only
> 
> ✅ **Zero trust architecture** - Even our own database administrators cannot read your debt details
> 
> Your debt journey remains private, secure, and under your control. 🔐

---

## Emergency Rollback

**If critical issues arise:**

1. **Immediate**: Switch API endpoints back to legacy (unencrypted) version
2. **Export**: Any encrypted debts created during deployment
3. **Migrate**: Back to legacy format if necessary
4. **Investigate**: Root cause before attempting re-deployment

**Rollback Commands:**
```bash
# Switch frontend back to legacy API
# Update API_BASE_URL in frontend config

# Export encrypted debts for recovery
npx wrangler d1 execute auth_db --remote \
  --command="SELECT * FROM debts WHERE ciphertext IS NOT NULL;"
```

---

**Deployment Lead**: _________________ **Date**: _________

**Security Review**: _________________ **Date**: _________

**Final Approval**: __________________ **Date**: _________