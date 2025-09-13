# TrySnowball Clean v2 - Deployment Guide

## Overview

TrySnowball Clean v2 uses Cloudflare Pages for hosting with separate staging and production environments.

## Environments

### 🟠 Staging Environment
- **URL**: https://staging.trysnowball.co.uk
- **Purpose**: Testing, demos, stakeholder reviews
- **PostHog**: Same project key with environment filtering
- **Stripe**: Test mode (safe for testing payments)
- **Environment Banner**: Orange banner showing "STAGING ENVIRONMENT"
- **Debug Mode**: Enabled

### 🟢 Production Environment
- **URL**: https://trysnowball.co.uk
- **Purpose**: Live user-facing application
- **PostHog**: Production analytics tracking
- **Stripe**: Live mode (real payments)
- **Environment Banner**: Hidden
- **Debug Mode**: Disabled

## Deployment Commands

### Quick Deploy to Staging
```bash
npm run deploy:staging
```

### Deploy to Production (with confirmation)
```bash
npm run deploy:production
```

### Manual Environment Builds
```bash
# Build for staging
npm run build:staging

# Build for production
npm run build:production
```

## Environment Configuration

### Required Files
- `.env.staging` - Staging environment variables
- `.env.production` - Production environment variables
- `.env.local` - Local development overrides

### Key Variables

#### PostHog Analytics
```bash
REACT_APP_POSTHOG_PROJECT_KEY=phc_TiBCyhgzWEmeR7XdAFMpzAoqZXfeAvVDJwmqiP2Eo7X
REACT_APP_POSTHOG_API_HOST=https://eu.i.posthog.com
```

#### Environment Identification
```bash
REACT_APP_ENVIRONMENT=staging|production
REACT_APP_VERSION=2.0.0
REACT_APP_SHOW_ENV_BANNER=true|false
```

#### Stripe Configuration
```bash
# Staging (test mode)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_STRIPE_PRICE_ID=price_test_...

# Production (live mode)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
REACT_APP_STRIPE_PRICE_ID=price_live_...
```

## Cloudflare Pages Setup

### Initial Setup
1. Connect GitHub repository to Cloudflare Pages
2. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `build`
   - **Node version**: `18`

### Environment Variables
Set these in Cloudflare Pages dashboard:

#### Staging Environment
- `REACT_APP_ENVIRONMENT`: `staging`
- `REACT_APP_SHOW_ENV_BANNER`: `true`
- `REACT_APP_DEBUG_MODE`: `true`

#### Production Environment
- `REACT_APP_ENVIRONMENT`: `production`
- `REACT_APP_SHOW_ENV_BANNER`: `false`
- `REACT_APP_DEBUG_MODE`: `false`

### Custom Domains
Configure in Cloudflare Pages dashboard:
- **Staging**: `staging.trysnowball.co.uk`
- **Production**: `trysnowball.co.uk`

## Testing Checklist

### Staging Deployment Verification
- [ ] Site loads at staging URL
- [ ] Orange environment banner displays
- [ ] Landing page → Upgrade page flow
- [ ] PostHog events firing (check console logs)
- [ ] Payment button shows test mode
- [ ] Success page displays correctly
- [ ] Analytics tracking works
- [ ] Mobile responsiveness

### Production Deployment Verification
- [ ] Site loads at production URL
- [ ] No environment banner visible
- [ ] All routes accessible
- [ ] PostHog events firing (production)
- [ ] Stripe live mode configured
- [ ] SSL certificate valid
- [ ] Performance metrics acceptable
- [ ] Error monitoring active

## Monitoring

### Analytics
- **PostHog Dashboard**: Track user behavior and conversion funnels
- **Environment Filtering**: Separate staging vs production events

### Error Monitoring
- Check Cloudflare Pages function logs
- Monitor PostHog error events
- Review browser console for client-side errors

### Performance
- Cloudflare Analytics for traffic patterns
- Core Web Vitals monitoring
- Bundle size tracking

## Rollback Procedure

### Emergency Rollback
1. In Cloudflare Pages dashboard, go to Deployments
2. Find previous working deployment
3. Click "Rollback to this deployment"
4. Verify rollback successful

### Planned Rollback
1. Revert problematic commits in Git
2. Run deployment command again
3. Verify functionality restored

## Troubleshooting

### Common Issues

#### Build Failures
- Check environment variables are set correctly
- Verify all dependencies installed: `npm install`
- Check for TypeScript errors: `npm run build`

#### Environment Banner Not Showing
- Verify `REACT_APP_SHOW_ENV_BANNER=true` in staging
- Check environment variable is set in Cloudflare Pages
- Clear browser cache and reload

#### Analytics Not Working
- Verify PostHog project key is correct
- Check browser developer console for errors
- Ensure environment variables are properly set

#### Payment Issues
- Verify Stripe keys match the environment (test vs live)
- Check Stripe dashboard for webhook configurations
- Ensure success/cancel URLs are correct for environment

## Security Notes

- Never commit `.env.production` with live Stripe keys
- Use test mode in staging environment
- Regularly rotate API keys
- Monitor for suspicious activity in production

## Support

For deployment issues:
1. Check this documentation
2. Review Cloudflare Pages logs
3. Check PostHog analytics for errors
4. Contact technical team if needed