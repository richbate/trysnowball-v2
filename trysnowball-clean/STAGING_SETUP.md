# TrySnowball Clean v2 - Staging Environment Setup

## Overview

This document covers the Cloudflare Pages staging environment setup for safe testing of the TrySnowball Clean v2 application at `staging.trysnowball.co.uk`.

## Environment Configuration

### Staging Environment
- **URL**: `staging.trysnowball.co.uk`
- **Environment**: `staging`
- **Build Branch**: `staging` (separate from `main`)
- **Password Protection**: Via Cloudflare Access
- **Analytics**: Separate PostHog staging project

### Production Environment  
- **URL**: `trysnowball.co.uk`
- **Environment**: `production`
- **Build Branch**: `main`
- **Password Protection**: None (public)
- **Analytics**: Production PostHog project

## Files Structure

```
├── .env.staging              # Staging environment variables
├── .env.production           # Production environment variables
├── wrangler.staging.toml     # Cloudflare Pages staging config
├── wrangler.production.toml  # Cloudflare Pages production config
├── scripts/
│   ├── deploy-staging.sh     # Staging deployment script
│   └── deploy-production.sh  # Production deployment script
└── src/components/
    └── StagingBanner.tsx     # Staging environment indicator
```

## Staging Features

### Visual Indicators
- **Orange staging banner** at top of all pages
- **Environment info** in banner (staging.trysnowball.co.uk • Test Mode)
- **Build information** showing version and commit hash

### Test Mode Configuration
- **Stripe Test Mode**: All payments use test API keys
- **PostHog Staging**: Separate analytics project for staging data
- **Debug Mode Enabled**: Additional logging and development tools
- **API Endpoints**: Points to staging API infrastructure

## Deployment Process

### Automatic Deployment (Recommended)
1. **Push to staging branch**: Automatic deployment via Cloudflare Pages
2. **Build process**: Uses `.env.staging` configuration
3. **Domain mapping**: Deploys to `staging.trysnowball.co.uk`

### Manual Deployment
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production  
npm run deploy:production
```

## Cloudflare Pages Setup

### Create Staging Project
1. **Cloudflare Dashboard** → Pages → Create a project
2. **Connect to Git** → Select repository
3. **Project name**: `trysnowball-clean-staging`
4. **Production branch**: `staging`
5. **Build settings**:
   - Build command: `npm run build:staging`
   - Build output directory: `build`

### Environment Variables (Cloudflare Dashboard)
```
REACT_APP_ENVIRONMENT=staging
REACT_APP_API_BASE_URL=https://staging-api.trysnowball.co.uk
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_POSTHOG_PROJECT_KEY=phc_staging_...
REACT_APP_STAGING_MODE=true
```

### Custom Domain Setup
1. **Custom domains** → Add custom domain
2. **Domain**: `staging.trysnowball.co.uk`  
3. **SSL/TLS**: Full (strict)
4. **DNS**: Add CNAME record pointing to Cloudflare Pages

## Access Control

### Password Protection (Cloudflare Access)
1. **Zero Trust** → Access → Applications
2. **Add application**:
   - Application name: `TrySnowball Staging`
   - Subdomain: `staging`
   - Domain: `trysnowball.co.uk`
3. **Policies**:
   - Team member emails for full access
   - Beta tester group for testing access

### Alternative: Basic Auth via Workers
```javascript
// Simple password protection
const STAGING_PASSWORD = "beta-test-2024";
// Implementation in Cloudflare Worker
```

## Testing Scenarios

### Critical User Flows
1. **Landing page** → Demo → Signup flow
2. **Payment integration** → Stripe test checkout  
3. **Success page** → Account setup
4. **Mobile responsiveness** across devices
5. **Analytics tracking** throughout journey

### Stripe Test Mode
- **Test Cards**: Use Stripe test card numbers
- **Successful Payment**: `4242424242424242`
- **Declined Payment**: `4000000000000002`
- **Webhook Testing**: Verify staging webhook endpoints

### PostHog Analytics Validation
- **Event Tracking**: Verify all analytics events fire
- **Staging Project**: Separate from production data
- **Conversion Funnel**: Test complete user journey tracking

## Environment Variables Reference

### Required for Staging
```bash
REACT_APP_ENVIRONMENT=staging
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Test mode key
REACT_APP_POSTHOG_PROJECT_KEY=phc_staging_...  # Staging project
REACT_APP_API_BASE_URL=https://staging-api.trysnowball.co.uk
REACT_APP_STAGING_MODE=true
REACT_APP_DEBUG_MODE=true
```

### Required for Production
```bash
REACT_APP_ENVIRONMENT=production
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...   # Live mode key
REACT_APP_POSTHOG_PROJECT_KEY=phc_...          # Production project
REACT_APP_API_BASE_URL=https://api.trysnowball.co.uk
REACT_APP_STAGING_MODE=false
REACT_APP_DEBUG_MODE=false
```

## Security Considerations

### Staging Security
- **Password protected** via Cloudflare Access
- **Test API keys only** - no live payment processing
- **Isolated data** - no production data access
- **Access logging** - monitor staging usage

### Production Security
- **Live API keys** - real payment processing
- **Production data** - customer information
- **SSL enforcement** - HTTPS only
- **Error monitoring** - production-grade logging

## Troubleshooting

### Common Issues

**Build Failures**
```bash
# Check environment variables are loaded
cat .env.staging

# Verify build script
npm run build:staging
```

**Deployment Errors**  
```bash
# Check Cloudflare Pages logs
npx wrangler pages deployment list

# Manual deployment
npx wrangler pages deploy build --project-name=trysnowball-clean-staging
```

**Environment Detection**
- Check staging banner appears on all pages
- Verify PostHog events go to staging project
- Confirm Stripe uses test mode

## Monitoring and Analytics

### Staging Analytics
- **PostHog Staging Project**: Isolated analytics data
- **Event Tracking**: All user interactions tracked
- **Conversion Funnel**: Payment flow completion rates
- **Error Monitoring**: Failed operations and edge cases

### Success Metrics
- **Payment Flow**: Successful test transactions
- **Mobile Usage**: Cross-device functionality
- **User Engagement**: Time spent, pages viewed
- **Error Rates**: Failed operations tracking

## Next Steps After Setup

1. **Test Payment Flow**: Complete Stripe test checkout
2. **Verify Analytics**: Check PostHog events firing
3. **Mobile Testing**: Cross-device validation
4. **Beta User Access**: Share staging URL with testers
5. **Performance Testing**: Load testing without production impact

---

**Staging URL**: https://staging.trysnowball.co.uk
**Production URL**: https://trysnowball.co.uk
