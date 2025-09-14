# Secure Debts API

Cloudflare Worker providing encrypted debt management with privacy-first analytics.

## Features

- **AES-256-GCM Encryption**: All sensitive debt data encrypted at rest
- **User-Specific Keys**: Each user's data encrypted with derived keys
- **Amount Banding**: De-identified analytics using amount bands
- **Issuer Hashing**: SHA-256 hashing of creditor names
- **GDPR Compliant**: Privacy-first design with opt-in analytics

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Debts API      │    │   D1 Database   │
│                 │───▶│   (Worker)       │───▶│                 │
│ - User debts    │    │ - Encryption     │    │ - Encrypted     │
│ - Local storage │    │ - Authentication │    │   ciphertext    │
│ - Sync to cloud │    │ - Key derivation │    │ - Amount bands  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Database Schema

### Encrypted Fields
- `ciphertext`: AES-256-GCM encrypted sensitive data
- `iv`: Initialization vector for encryption
- `dek_version`: Data encryption key version

### Analytics Fields  
- `amount_band`: De-identified amount range (e.g., "2-5k")
- `issuer_hash`: SHA-256 hash of creditor name
- `debt_type`: Category (credit_card, loan, etc.)

### Metadata
- `encrypted_at`: Timestamp of encryption
- `last_decrypted_at`: Last access time

## API Endpoints

### GET /api/debts
Get all debts for authenticated user (decrypted)

```bash
curl -H "Authorization: Bearer <jwt>" \
     https://trysnowball.co.uk/api/debts
```

### POST /api/debts
Create new encrypted debt

```bash
curl -X POST \
     -H "Authorization: Bearer <jwt>" \
     -H "Content-Type: application/json" \
     -d '{"name":"Credit Card","balance":1500,"interestRate":23.99,"minPayment":50}' \
     https://trysnowball.co.uk/api/debts
```

### PUT /api/debts/:id
Update existing debt (re-encrypts)

### DELETE /api/debts/:id
Delete debt

### PUT /api/debts
Bulk replace all debts (encrypted batch operation)

### POST /api/crypto/test
Test encryption/decryption roundtrip

## Environment Variables

Required secrets (set via `wrangler secret put`):

- `JWT_SECRET`: JWT signing key (shared with auth worker)
- `ENCRYPTION_KEY`: Master encryption key (256-bit random key)

## Deployment

1. **Set secrets:**
```bash
# Generate secure random key
openssl rand -base64 32

# Set in Cloudflare
wrangler secret put ENCRYPTION_KEY --config wrangler-debts.toml
wrangler secret put JWT_SECRET --config wrangler-debts.toml
```

2. **Run migration:**
```bash
npx wrangler d1 execute auth_db --file=../migrations/002_secure_debts.sql
```

3. **Deploy:**
```bash
./deploy-secure-debts.sh
```

## Security Features

### Key Derivation
```javascript
// Each user gets unique encryption key
const userKey = await deriveKey(masterKey, userId, version);
```

### Data Minimization
- Only sensitive fields encrypted (name, balance, rates)
- Non-sensitive metadata stored in plaintext
- Amount banding prevents exact value exposure

### Forward Secrecy
- Key versioning allows rotation
- Old versions remain decryptable
- Gradual migration to new keys

### Privacy Analytics
- PostHog receives only de-identified data
- Amount bands instead of exact values
- Hashed issuer names, never plaintext
- User opt-in required

## Files

- `debts-api.js`: Main API worker
- `crypto-utils.js`: Encryption/decryption utilities  
- `wrangler-debts.toml`: Worker configuration
- `deploy-secure-debts.sh`: Deployment script
- `../migrations/002_secure_debts.sql`: Database schema

## Testing

Test encryption roundtrip:
```bash
curl -X POST \
     -H "Authorization: Bearer <jwt>" \
     https://trysnowball.co.uk/api/crypto/test
```

Expected response:
```json
{
  "success": true,
  "message": "Encryption test passed"
}
```