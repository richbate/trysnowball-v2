# 🔧 Secure Debt Encryption - Operations Runbook

## Key Rotation Procedures

### Annual Key Rotation (Planned)

**Frequency**: Every 12 months or when required by compliance

**Steps**:
1. **Generate new master key**
   ```bash
   # Generate MASTER_KEY_V2 (never commit!)
   NEW_KEY=$(openssl rand -base64 32)
   echo "New key generated: $NEW_KEY"
   ```

2. **Update worker environment**
   ```bash
   wrangler secret put MASTER_KEY_V2 --config wrangler-debts.toml --env production
   ```

3. **Update crypto-utils.js to support V2**
   ```javascript
   // Add to deriveUserKey function
   const keyMap = {
     1: env.MASTER_KEY_V1,
     2: env.MASTER_KEY_V2
   };
   const masterKey = keyMap[keyVersion] || env.MASTER_KEY_V1;
   ```

4. **Deploy updated worker**
   ```bash
   ./deploy-secure-debts.sh --env production
   ```

5. **Lazy re-encryption strategy**
   - New debts automatically use V2
   - Existing debts re-encrypted on next update
   - Background job can batch-update if needed

6. **Monitor migration progress**
   ```sql
   SELECT dek_version, COUNT(*) FROM debts GROUP BY dek_version;
   ```

7. **Retire old key** (after 100% migration)

### Emergency Key Rotation (Security Incident)

**Trigger**: Key compromise, security breach, or insider threat

**Immediate Actions** (within 1 hour):
1. **Generate new key immediately**
2. **Deploy with new key version**
3. **Audit all recent decryptions**
4. **Consider forcing re-authentication**

**Follow-up** (within 24 hours):
1. **Re-encrypt all affected data**
2. **Security audit of access logs**
3. **Incident report and lessons learned**

## Performance Monitoring

### Key Derivation Optimization

**Current**: PBKDF2 with 100,000 iterations per request
**Optimization**: Cache derived keys per user session

```javascript
// Add to crypto-utils.js
const keyCache = new Map(); // Worker memory cache

export async function getCachedUserKey(masterKey, userId, keyVersion = 1) {
  const cacheKey = `${userId}-${keyVersion}`;
  
  if (keyCache.has(cacheKey)) {
    return keyCache.get(cacheKey);
  }
  
  const derivedKey = await deriveUserKey(masterKey, userId, keyVersion);
  
  // Cache for 1 hour, max 100 users
  if (keyCache.size < 100) {
    keyCache.set(cacheKey, derivedKey);
    setTimeout(() => keyCache.delete(cacheKey), 3600000);
  }
  
  return derivedKey;
}
```

### Monitoring Metrics

**Response Time Targets**:
- Single debt decrypt: <100ms
- Batch (10 debts): <300ms
- New debt encrypt: <150ms

**Alert Thresholds**:
- P95 latency >500ms
- Decryption failure rate >1%
- Key derivation time >50ms

### Performance Queries

```sql
-- Monitor encryption adoption
SELECT 
  COUNT(CASE WHEN ciphertext IS NOT NULL THEN 1 END) as encrypted,
  COUNT(CASE WHEN ciphertext IS NULL THEN 1 END) as legacy,
  COUNT(*) as total
FROM debts;

-- Check key version distribution
SELECT dek_version, COUNT(*) as count 
FROM debts 
WHERE ciphertext IS NOT NULL 
GROUP BY dek_version;

-- Audit recent decryptions
SELECT user_id, COUNT(*) as decryptions
FROM debts 
WHERE last_decrypted_at > unixepoch('now', '-1 hour')
GROUP BY user_id
ORDER BY decryptions DESC;
```

## Security Monitoring

### Audit Log Monitoring

**What to Log** ✅:
- User ID accessing encrypted data
- Number of debts decrypted
- Timestamp of access
- Key version used
- Geographic location (if available)

**What NOT to Log** ❌:
- Plaintext debt data
- Exact amounts
- Creditor names
- Decrypted content

### Suspicious Activity Patterns

**Red Flags**:
- User decrypting >100 debts in short period
- Cross-user key attempts (should fail)
- High decryption failure rate from single IP
- Unusual geographic access patterns

**Automated Responses**:
- Rate limiting after N failed decryptions
- Temporary account freeze for suspicious patterns
- Alert security team for investigation

### Security Audit Checklist (Monthly)

- [ ] **Key security**: No keys in logs, code, or git history
- [ ] **Access patterns**: Review unusual decryption activities  
- [ ] **Error rates**: Investigate high failure rates
- [ ] **Data leakage**: Scan logs for accidental plaintext exposure
- [ ] **Compliance**: Verify GDPR data handling procedures

## Incident Response Procedures

### Severity Levels

**P0 - Critical Security Breach**
- Master key compromised
- Unauthorized access to plaintext data
- Data exfiltration detected

**P1 - High Impact**  
- Encryption system down
- Mass decryption failures
- Analytics receiving raw data

**P2 - Medium Impact**
- Performance degradation >2x baseline
- Single user unable to decrypt debts
- Non-critical logging issues

### P0 Response (Key Compromise)

**Immediate** (0-15 minutes):
1. **Rotate keys** using emergency procedure
2. **Disable** affected worker immediately
3. **Alert** security team and leadership
4. **Document** initial findings

**Short term** (15 minutes - 2 hours):
1. **Audit** all recent access logs  
2. **Identify** potentially affected users
3. **Deploy** new worker with rotated keys
4. **Monitor** for continued unauthorized access

**Follow-up** (2-48 hours):
1. **Full security audit** of infrastructure
2. **User notification** if legally required
3. **Re-encrypt** all affected data
4. **Incident report** and remediation plan

### P1 Response (System Down)

**Immediate**:
1. **Check** worker health and D1 status
2. **Verify** encryption keys are accessible  
3. **Review** recent deployments for issues
4. **Rollback** if necessary

**Communication**:
1. **Internal**: Update #engineering channel
2. **External**: Status page update if user-facing
3. **Timeline**: Regular updates every 30 minutes

## Backup & Recovery

### Key Backup Strategy

**Master Keys**:
- Stored in Cloudflare Workers secrets (primary)
- Backup copy in company password manager (encrypted)
- Physical backup in company safe (for true disasters)

**Never store keys**:
- In git repositories
- In plain text files  
- In unencrypted cloud storage
- In personal password managers

### Data Recovery Procedures

**Scenario 1**: Worker corruption, keys intact
- Redeploy worker from git
- Keys auto-restored from secrets
- No data loss

**Scenario 2**: D1 database corruption  
- Restore from automated D1 backups
- Keys remain intact
- Some data loss possible (last backup point)

**Scenario 3**: Total key loss (disaster)
- Encrypted data becomes unrecoverable
- Fall back to user re-entry
- Implement from physical key backup if available

## Compliance & Legal

### GDPR Compliance

**Right to Access**: Users can export their decrypted debt data
**Right to Deletion**: Encrypted debts deleted on user request  
**Right to Portability**: Data export in standard JSON format
**Data Minimization**: Only necessary fields encrypted

### Data Retention

**Encrypted Debts**: Retained per user preferences (default: indefinitely)
**Audit Logs**: 7 years for compliance
**Analytics Events**: 2 years maximum  
**Backup Copies**: Same retention as primary data

### Regulatory Reporting

**Quarterly**: Security posture review
**Annually**: Penetration testing of encryption system
**As needed**: Breach notification within 72 hours

---

## Emergency Contacts

**Security Lead**: [Name] - [Email] - [Phone]
**DevOps Lead**: [Name] - [Email] - [Phone]  
**Legal Counsel**: [Name] - [Email] - [Phone]
**Cloudflare Support**: Enterprise support ticket system

**After Hours**: Follow company escalation matrix