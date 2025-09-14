# Secure Debt Data Integration Guide

Integration steps for using the encrypted debt API with privacy-first analytics.

## ✅ Implementation Status

### Completed Components

1. **Database Schema** (`migrations/002_secure_debts.sql`)
   - Added encryption columns (`dek_version`, `iv`, `ciphertext`)
   - Added analytics columns (`amount_band`, `issuer_hash`, `debt_type`)
   - Created audit columns (`encrypted_at`, `last_decrypted_at`)
   - Created analytics tables for local event tracking

2. **Amount Banding** (`src/shared/amountBands.ts`)
   - De-identified amount ranges: "0-500", "500-1k", "1-2k", etc.
   - Delta banding for balance change tracking
   - Utility functions for band formatting

3. **Secure Analytics** (`src/utils/secureAnalytics.ts`)  
   - SHA-256 issuer hashing in browser
   - De-identified event preparation
   - Analytics opt-in preference management

4. **PostHog Configuration** (`src/lib/posthog.js`)
   - EU region for GDPR compliance
   - Privacy-first settings (no autocapture, no session recording)
   - De-identified event tracking
   - Development user exclusion

5. **Analytics Opt-In UI** (`src/components/AnalyticsOptIn.jsx`)
   - Clear privacy information display
   - Toggle for user consent
   - Detailed data collection transparency

6. **Worker-Side Encryption** (`cloudflare-workers/`)
   - AES-256-GCM encryption utilities (`crypto-utils.js`)
   - Encrypted debt API (`debts-api.js`)
   - User-specific key derivation
   - Deployment configuration

## 🔧 Next Steps for Full Integration

### 1. Update Frontend API Layer

Update `src/data/localDebtStore.ts` to use new encrypted API:

```typescript
// Switch API endpoint to encrypted version
const DEBTS_API_URL = 'https://trysnowball.co.uk/api/debts';

// All API calls now automatically encrypted/decrypted server-side
// Frontend continues to work with plain debt objects
```

### 2. Deploy Workers

```bash
cd cloudflare-workers

# Set encryption key (generate with: openssl rand -base64 32)
wrangler secret put ENCRYPTION_KEY --config wrangler-debts.toml

# Deploy to staging
./deploy-secure-debts.sh
```

### 3. Run Database Migration

```bash
# Apply schema changes to D1
npx wrangler d1 execute auth_db --file=../migrations/002_secure_debts.sql
```

### 4. Update Analytics Integration

Add to `src/hooks/useUserDebts.js`:

```javascript
import { captureDebtAdded, captureDebtUpdated } from '../utils/secureAnalytics';

// When debt is added
await captureDebtAdded(newDebt, userTier);

// When debt is updated  
captureDebtUpdated(oldBalance, newBalance);
```

### 5. Add Analytics Opt-In to Settings

Add to user settings page (`src/pages/Profile.jsx`):

```jsx
import AnalyticsOptIn from '../components/AnalyticsOptIn';

// In settings UI
<AnalyticsOptIn />
```

## 🛡️ Security Architecture

### Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Secure API     │    │   D1 Database   │
│                 │    │   (Worker)       │    │                 │
│ Plain debt data │───▶│ Encrypt on POST  │───▶│ Encrypted data  │
│ (local/demo)    │    │ Decrypt on GET   │    │ + Amount bands  │
│                 │◀───│ Return plaintext │◀───│ + Issuer hash   │
└─────────────────┘    └──────────────────┘    └─────────────────┘

                              │
                              ▼
                    ┌──────────────────┐
                    │   PostHog EU     │
                    │                  │
                    │ De-identified    │
                    │ events only      │
                    └──────────────────┘
```

### Privacy Guarantees

- **Encryption at Rest**: AES-256-GCM in D1
- **Key Isolation**: Per-user derived keys
- **Data Minimization**: Only sensitive fields encrypted
- **Analytics Opt-In**: User consent required
- **De-Identification**: Amount bands + hashed issuers
- **EU Region**: PostHog EU for GDPR compliance

### Key Management

```javascript
// Master key (environment secret)
ENCRYPTION_KEY = "base64-encoded-256-bit-key"

// Derived per-user key
userKey = PBKDF2(ENCRYPTION_KEY, userId + salt, 100k iterations)

// Unique per-record IV
iv = crypto.getRandomValues(12 bytes)

// Ciphertext
ciphertext = AES-GCM-256(sensitive_data, userKey, iv)
```

## 📊 Analytics Events

### De-Identified Event Examples

```javascript
// Debt added (de-identified)
{
  event: 'debt_added',
  amount_band: '2-5k',          // Not exact amount
  debt_type: 'credit_card',     // Category only  
  issuer_hash: 'a1b2c3d4',     // SHA-256 hash
  user_tier: 'free'
}

// Balance updated (de-identified)
{
  event: 'debt_updated',
  delta_band: '-500-1k',        // Reduction range
  direction: 'decrease'         // Progress direction
}
```

### Never Collected
- Exact debt amounts or balances
- Actual creditor/issuer names  
- Account numbers or personal details
- Interest rates or payment amounts
- User notes or comments

## 🧪 Testing

### Encryption Test

```bash
curl -X POST \
     -H "Authorization: Bearer <jwt>" \
     https://trysnowball.co.uk/api/crypto/test
```

### Analytics Test

```javascript
// Frontend console
import { captureDebtAdded } from './src/utils/secureAnalytics';

// Test de-identified capture
await captureDebtAdded({
  name: 'Test Card',
  balance: 2500,
  type: 'credit_card'
});
```

## 📋 Deployment Checklist

- [ ] Run D1 migration (002_secure_debts.sql)
- [ ] Generate and set ENCRYPTION_KEY secret
- [ ] Deploy secure debts worker
- [ ] Update frontend API endpoints  
- [ ] Test encryption roundtrip
- [ ] Test analytics opt-in flow
- [ ] Verify PostHog receives de-identified events
- [ ] Monitor error rates and decryption success

## 🔗 Related Files

### Core Implementation
- `cloudflare-workers/debts-api.js` - Encrypted API
- `cloudflare-workers/crypto-utils.js` - Encryption utilities
- `migrations/002_secure_debts.sql` - Database schema

### Frontend Integration  
- `src/utils/secureAnalytics.ts` - De-identified analytics
- `src/shared/amountBands.ts` - Privacy banding
- `src/components/AnalyticsOptIn.jsx` - User consent UI
- `src/lib/posthog.js` - Privacy-first configuration

### Documentation
- `SECURE_DEBT_PRD.md` - Product requirements
- `SECURITY_DATA.md` - Security documentation
- `cloudflare-workers/README-secure-debts.md` - API guide