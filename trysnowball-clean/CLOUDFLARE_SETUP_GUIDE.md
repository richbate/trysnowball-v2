# Cloudflare Setup Guide for TrySnowball Clean v2

This guide explains the complete Cloudflare configuration for TrySnowball Clean v2, including the relationship between Cloudflare Pages (frontend) and Workers (backend APIs).

## Architecture Overview

```
staging.trysnowball.co.uk
├── Frontend (Cloudflare Pages)
│   ├── React app with staging banner
│   ├── Built with: npm run build:staging
│   └── Environment: REACT_APP_ENVIRONMENT=staging
└── Backend APIs (Cloudflare Workers)
    ├── /auth/* → trysnowball-auth-staging worker
    ├── /api/debts* → trysnowball-debts-api-staging worker
    ├── /api/crypto/* → trysnowball-debts-api-staging worker
    └── /api/user/* → trysnowball-debts-api-staging worker
```

## Setup Steps

### 1. Cloudflare Pages Setup
1. **Create Pages Project:**
   ```bash
   # In trysnowball-clean directory
   wrangler pages project create trysnowball-clean-staging
   ```

2. **Configure Custom Domain:**
   - Go to Cloudflare Dashboard → Pages → trysnowball-clean-staging
   - Add custom domain: `staging.trysnowball.co.uk`
   - Ensure DNS record points to Pages

3. **Deploy Staging Build:**
   ```bash
   npm run build:staging
   wrangler pages deploy build --project-name=trysnowball-clean-staging
   ```

4. **Set Environment Variables:**
   ```bash
   wrangler pages secret put REACT_APP_ENVIRONMENT --env=staging
   # Value: staging

   wrangler pages secret put REACT_APP_API_BASE_URL --env=staging
   # Value: https://staging.trysnowball.co.uk

   wrangler pages secret put REACT_APP_STRIPE_MODE --env=staging
   # Value: test
   ```

### 2. Cloudflare Workers Update (Already Done)
The existing workers have been updated to support both staging environments:

- **Auth Worker** (`wrangler.toml`): Handles authentication for both:
  - `staging-trysnowball.pages.dev/auth/*` (v1 staging)
  - `staging.trysnowball.co.uk/auth/*` (v2 staging)

- **Debts API Worker** (`wrangler-debts.toml`): Handles API calls for both:
  - `staging-trysnowball.pages.dev/api/*` (v1 staging)
  - `staging.trysnowball.co.uk/api/*` (v2 staging)

### 3. Deploy Workers to Staging
```bash
cd ../trysnowball-frontend/cloudflare-workers/

# Deploy auth worker
wrangler deploy --env staging

# Deploy debts API worker
wrangler deploy -c wrangler-debts.toml --env staging

# Deploy checkout API worker (if needed)
wrangler deploy -c wrangler-checkout.toml --env staging
```

### 4. DNS Configuration
Ensure these DNS records exist in `trysnowball.co.uk` zone:
```
staging.trysnowball.co.uk CNAME <pages-project>.pages.dev (proxied)
```

### 5. Security Configuration (Optional)
To add password protection to staging:

1. **Enable Cloudflare Access:**
   ```bash
   # Install cloudflared
   brew install cloudflare/cloudflare/cloudflared

   # Configure Access policy for staging.trysnowball.co.uk
   # Require email domain @trysnowball.co.uk or specific emails
   ```

2. **Set up Basic Auth Alternative:**
   - Use Cloudflare Page Rules to add HTTP Basic Auth
   - Username/Password for team access

## File Structure

```
trysnowball-clean/
├── pages-config.toml          # Cloudflare Pages configuration
├── wrangler.staging.toml      # Workers config (for reference)
├── wrangler.production.toml   # Workers config (for reference)
├── CLOUDFLARE_SETUP_GUIDE.md  # This file
└── src/
    └── components/
        └── StagingBanner.tsx   # Shows staging environment indicator

trysnowball-frontend/cloudflare-workers/
├── wrangler.toml             # Auth worker config (updated for v2)
├── wrangler-debts.toml       # Debts API config (updated for v2)
└── wrangler-checkout.toml    # Checkout API config
```

## Environment Variables Summary

### Pages Environment Variables
- `REACT_APP_ENVIRONMENT`: "staging" or "production"
- `REACT_APP_API_BASE_URL`: Base URL for API calls
- `REACT_APP_STRIPE_MODE`: "test" or "live"

### Workers Environment Variables (via secrets)
- `JWT_SECRET`: Shared secret for JWT verification
- `MASTER_KEY_V1`: Encryption key for sensitive data
- `METRICS_HMAC_KEY`: Key for analytics event signing
- `SENDGRID_API_KEY`: Email service API key

## Testing the Setup

1. **Build and Deploy:**
   ```bash
   npm run build:staging
   wrangler pages deploy build --project-name=trysnowball-clean-staging
   ```

2. **Verify Staging Environment:**
   - Visit `https://staging.trysnowball.co.uk`
   - Should show orange "STAGING ENVIRONMENT" banner
   - Check Network tab - API calls should go to staging.trysnowball.co.uk

3. **Test API Endpoints:**
   ```bash
   # Test auth endpoint
   curl https://staging.trysnowball.co.uk/auth/health

   # Test debts API
   curl https://staging.trysnowball.co.uk/api/health
   ```

## Production Setup
For production, the same process applies but with:
- Domain: `trysnowball.co.uk`
- Build command: `npm run build`
- Environment: `REACT_APP_ENVIRONMENT=production`
- Stripe mode: `REACT_APP_STRIPE_MODE=live`

## Monitoring & Debugging
- **Pages Logs:** Cloudflare Dashboard → Pages → Functions → Logs
- **Workers Logs:** `wrangler tail --env staging`
- **Analytics:** Built into Cloudflare Dashboard
- **Real User Monitoring:** Available via Cloudflare

## Next Steps After Setup
1. Configure PostHog for staging analytics
2. Set up staging-specific Stripe webhooks
3. Test complete user flows in staging
4. Set up automated deployments via GitHub Actions
5. Configure staging database migrations