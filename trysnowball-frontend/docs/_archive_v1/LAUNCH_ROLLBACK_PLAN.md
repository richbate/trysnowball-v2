# Open Beta Launch - Rollback Plan

## Current Production Versions (Pre-Launch Baseline)

- **Auth Worker**: `trysnowball-auth-main-prod`
  - Version ID: `5bfb22f4-1e58-4a33-8f2e-366c8a59177e`
  - Routes: `trysnowball.co.uk/auth/*`, `www.trysnowball.co.uk/auth/*`
- **Debts Worker**: `trysnowball-debts-api-prod`
  - Version ID: `468bbcba-66ef-4c90-91f0-9947571dfeba`
  - Routes: `trysnowball.co.uk/api/*`, `www.trysnowball.co.uk/api/*`

## Status Endpoints (Launch Monitoring)

- Auth: <https://trysnowball.co.uk/auth/status>
- Debts: <https://trysnowball.co.uk/api/status>

## Emergency Rollback Commands

```bash
# Rollback to previous auth worker version
wrangler rollback 63039f2f-f44c-435c-8728-54a0de43b174 --config wrangler.toml --env production

# Rollback to previous debts worker version  
wrangler rollback 6e0c5f21-53af-4825-9a93-31e534ee3ccb --config wrangler-debts.toml --env production
```

## Feature Flags (if needed)

- `ENCRYPTION_ENABLED=false` - Disable encryption, use legacy storage
- `ANALYTICS_OPT_IN_DEFAULT=false` - Default to analytics opt-out

## Rollback Triggers

- **P0**: Status endpoints return 503 for >2 minutes
- **P0**: Auth failures >10% for >5 minutes
- **P0**: Debt decryption failures >5%
- **P1**: D1 latency p95 >500ms sustained
- **P1**: User-reported data loss or corruption

## Launch Window Monitoring (First 24h)

1. **Worker Health**: Check status endpoints every 5 minutes
2. **PostHog Events**: Monitor `debt_added`, `user_registered`, analytics opt-in %
3. **Error Logs**: `wrangler tail trysnowball-auth-main-prod` + `wrangler tail trysnowball-debts-api-prod`
4. **Database**: Check D1 metrics in Cloudflare dashboard

## Key Contacts

- **Primary**: @richbate (deployment owner)
- **Escalation**: Cloudflare support (if infrastructure issues)

---

*Generated: 2025-09-03 12:15 - Open Beta Launch Preparation*