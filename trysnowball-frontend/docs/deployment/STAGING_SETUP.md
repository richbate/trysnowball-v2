# TrySnowball Staging Environment Setup

## 🎯 Quick Start

Your staging environment is configured for `staging.trysnowball.co.uk` with separate workers and test Stripe integration.

## 🏗️ What's Already Configured

✅ **Staging Workers Deployed**:
- Auth: `staging-trysnowball.pages.dev/auth/*`
- Checkout: `staging-trysnowball.pages.dev/api/*`

✅ **Separate JWT Secrets**: Staging uses different JWT secrets than production

✅ **Environment Files**: 
- `.env` - Production config
- `.env.staging` - Staging config with test Stripe keys

## 🔧 Configuration Needed

### 1. Cloudflare Pages Setup
Create a staging deployment:
- Deploy to `staging-trysnowball.pages.dev` 
- No DNS setup needed (security by obscurity)

### 2. Stripe Test Keys
Update `.env.staging` with your actual Stripe test keys:

```bash
# Get from https://dashboard.stripe.com/test/apikeys
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY

# Set worker secrets:
wrangler secret put STRIPE_SECRET_KEY --env staging --config wrangler-checkout.toml
# Enter: sk_test_YOUR_TEST_SECRET_KEY

# Create test products in Stripe test mode and update:
wrangler secret put STRIPE_FOUNDERS_PRICE_ID --env staging --config wrangler-checkout.toml
# Enter: price_test_YOUR_FOUNDERS_TEST_PRICE

# Update .env.staging:
REACT_APP_STRIPE_PRICE_ID=price_test_YOUR_MONTHLY_TEST_PRICE
```

### 3. Frontend Deployment
Configure your frontend deployment (Cloudflare Pages/Netlify) to:
- Deploy `main` branch to production (`trysnowball.co.uk`)  
- Deploy `staging` branch to staging (`staging.trysnowball.co.uk`)
- Use `.env.staging` for staging builds

## 🚀 Deployment Commands

### Deploy to Staging
```bash
./scripts/deploy-staging.sh
```

### Test Staging
```bash
./scripts/test-staging.sh
```

### Deploy Workers Only
```bash
# Auth worker
wrangler deploy --config wrangler.toml --env staging

# Checkout worker  
wrangler deploy --config wrangler-checkout.toml --env staging
```

## 🧪 Testing Workflow

1. **Make changes** on a feature branch
2. **Merge to staging branch** → auto-deploys to staging.trysnowball.co.uk
3. **Test on staging** with Stripe test cards
4. **Merge staging to main** → auto-deploys to production

## 🎯 Stripe Test Cards

Use these in staging for testing:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`  
- **3D Secure**: `4000 0027 6000 3184`

## 🔍 Environment Differences

| Feature | Production | Staging |
|---------|------------|---------|
| **Domain** | trysnowball.co.uk | staging.trysnowball.co.uk |
| **Stripe** | Live mode | Test mode |
| **JWT Secret** | Production secret | Test secret |
| **Database** | Shared (same D1) | Shared (same D1)* |
| **Analytics** | Production PostHog | Same PostHog* |

*Consider separate staging database and analytics in the future

## 🚨 Next Steps

1. **Set up staging DNS** record
2. **Configure Stripe test mode** with real test keys  
3. **Create staging branch** for automated deployments
4. **Test the full flow** end-to-end on staging

---

*Now you can test changes safely before pushing to production!* 🎉