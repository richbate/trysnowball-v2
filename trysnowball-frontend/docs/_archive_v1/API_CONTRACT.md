# 🔐 Billing API Contract

## Overview
The TrySnowball billing API provides a single endpoint to check user plan status. This contract defines the expected behavior for integration and testing.

## Authentication
All endpoints require valid session authentication via HTTP-only cookies.

## Endpoint: Plan Status

### `GET /auth/api/me/plan`

Returns the current user's billing status and plan type.

#### Request
```http
GET /auth/api/me/plan HTTP/1.1
Host: trysnowball.co.uk
Cookie: __session=<session_token>
```

#### Success Response (200)
```json
{
  "is_paid": boolean,
  "source": "beta" | "stripe" | "none"
}
```

#### Response Headers
```http
Content-Type: application/json
Cache-Control: no-store
Access-Control-Allow-Origin: https://trysnowball.co.uk
```

#### Error Response (401 Unauthorized)
```json
{
  "error": "Unauthorized"
}
```

#### Error Response (500 Internal Server Error)
```json
{
  "is_paid": false,
  "source": "none",
  "error": "Failed to fetch plan status"
}
```

## Plan Status Logic

| `is_pro` | `beta_access` | `is_paid` | `source` | Description |
|----------|---------------|-----------|----------|-------------|
| 0        | 1             | `true`    | `"beta"` | Beta access user |
| 1        | 0             | `true`    | `"stripe"` | Stripe subscriber |
| 1        | 1             | `true`    | `"beta"` | Beta access takes precedence |
| 0        | 0             | `false`   | `"none"` | Free user |

## Security & Privacy

### Data Minimization
- Response contains **only** `is_paid` and `source`
- No PII (email, user ID, etc.) is returned
- No payment details or subscription metadata

### Headers
- `Cache-Control: no-store` prevents caching
- CORS headers restrict cross-origin access
- Session-based authentication (no tokens in response)

### Rate Limiting
- Standard Cloudflare Worker limits apply
- Consider adding per-IP rate limiting for production

## Monitoring

### Logging
- Plan checks logged with truncated user ID: `user=12345678...`
- No sensitive data in logs
- Error conditions logged with context

### Metrics
- Track plan check frequency by source type
- Monitor 401 rate for auth issues
- Alert on error rate > 1%

## Testing Contract

### Unit Tests
```javascript
// Beta user
expect(getPlan(mockDB({ is_pro: 0, beta_access: 1 }), 'user123'))
  .resolves.toEqual({ is_paid: true, source: 'beta' });

// Stripe user
expect(getPlan(mockDB({ is_pro: 1, beta_access: 0 }), 'user123'))
  .resolves.toEqual({ is_paid: true, source: 'stripe' });

// Free user
expect(getPlan(mockDB({ is_pro: 0, beta_access: 0 }), 'user123'))
  .resolves.toEqual({ is_paid: false, source: 'none' });
```

### Integration Tests
```javascript
// Authenticated user
fetch('/auth/api/me/plan', { credentials: 'include' })
  .then(r => r.json())
  .then(data => {
    expect(data).toHaveProperty('is_paid');
    expect(data).toHaveProperty('source');
    expect(['beta', 'stripe', 'none']).toContain(data.source);
  });

// Unauthenticated user
fetch('/auth/api/me/plan', { credentials: 'omit' })
  .then(r => {
    expect(r.status).toBe(401);
    expect(r.headers.get('cache-control')).toBe('no-store');
  });
```

## Frontend Integration

### React Hook Pattern
```javascript
const { isPaid, source, loading, error } = useUserPlan();

// UI conditional rendering
{isPaid ? <PremiumFeatures /> : <UpgradePrompt />}

// Beta user badge
{source === 'beta' && <BetaAccessBadge />}

// Stripe portal access
{source === 'stripe' && <ManageSubscriptionButton />}
```

### Error Handling
- 401: Clear auth state, redirect to login
- 500: Show generic error, fallback to free tier
- Network: Retry with exponential backoff

## Compatibility

### Breaking Changes
Changes that break this contract require:
1. Version bump in API path (e.g., `/auth/api/v2/me/plan`)
2. Backward compatibility period (minimum 30 days)
3. Client update coordination

### Non-Breaking Changes
Safe modifications:
- Adding optional response fields
- Adding new `source` values (with client fallback)
- Header modifications
- Internal implementation changes

---

**Contract Version**: 1.0  
**Last Updated**: 2025-09-04  
**Owner**: TrySnowball Billing Team