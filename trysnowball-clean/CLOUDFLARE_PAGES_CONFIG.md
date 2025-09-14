# Cloudflare Pages Configuration - TrySnowball Clean v2

## Project Overview
- **Project Name**: `trysnowball-v2`
- **Framework**: React (Create React App)
- **Build Output**: `build/`
- **Node Version**: 18.17.0

## Environment Configuration

### Staging Environment
- **Custom Domain**: `staging.trysnowball.co.uk`
- **Build Command**: `npm run build:staging`
- **Environment File**: `.env.staging`

### Production Environment
- **Custom Domain**: `clean.trysnowball.co.uk` (or replace main domain)
- **Build Command**: `npm run build:production`
- **Environment File**: `.env.production`

## Files Structure

### Configuration Files
```
├── wrangler-pages.toml          # Primary Pages configuration
├── pages-config.toml            # Legacy config (can be removed)
├── .env.staging                 # Staging environment variables
├── .env.production              # Production environment variables
└── scripts/deploy-pages.sh      # Deployment script
```

### Key Environment Variables

#### Staging (.env.staging)
```
REACT_APP_ENVIRONMENT=staging
REACT_APP_API_BASE_URL=https://staging-api.trysnowball.co.uk
REACT_APP_STRIPE_MODE=test
REACT_APP_DEBUG_MODE=true
REACT_APP_POSTHOG_ENVIRONMENT=staging
```

#### Production (.env.production)
```
REACT_APP_ENVIRONMENT=production
REACT_APP_API_BASE_URL=https://api.trysnowball.co.uk
REACT_APP_STRIPE_MODE=live
REACT_APP_DEBUG_MODE=false
REACT_APP_POSTHOG_ENVIRONMENT=production
```

## Cloudflare Dashboard Configuration

### Build Settings
```
Build command: npm run build:staging
Build output directory: /build
Root directory: /
```

### Environment Variables (Set in CF Dashboard)
**Staging**:
- `NODE_VERSION`: `18.17.0`
- `REACT_APP_ENVIRONMENT`: `staging`
- `REACT_APP_API_BASE_URL`: `https://staging-api.trysnowball.co.uk`
- `REACT_APP_STRIPE_MODE`: `test`
- `GENERATE_SOURCEMAP`: `false`

**Production**:
- `NODE_VERSION`: `18.17.0`
- `REACT_APP_ENVIRONMENT`: `production`
- `REACT_APP_API_BASE_URL`: `https://api.trysnowball.co.uk`
- `REACT_APP_STRIPE_MODE`: `live`
- `GENERATE_SOURCEMAP`: `false`

### Custom Domains
1. Go to Pages → trysnowball-v2 → Custom domains
2. Add `staging.trysnowball.co.uk` for preview/staging
3. Add `clean.trysnowball.co.uk` for production

### DNS Records (in Cloudflare DNS)
```
Type: CNAME
Name: staging.trysnowball.co.uk
Target: trysnowball-v2.pages.dev
Proxy: Yes (Orange cloud)

Type: CNAME
Name: clean.trysnowball.co.uk
Target: trysnowball-v2.pages.dev
Proxy: Yes (Orange cloud)
```

## Security Headers
Configured in `wrangler-pages.toml`:
- `X-Frame-Options`: DENY
- `X-Content-Type-Options`: nosniff
- `X-XSS-Protection`: 1; mode=block
- `Strict-Transport-Security`: max-age=31536000; includeSubDomains; preload
- `Referrer-Policy`: strict-origin-when-cross-origin
- `Permissions-Policy`: camera=(), microphone=(), geolocation=()

## SPA Routing
React Router routing configured with fallback to `index.html` for client-side routing.

## Deployment Commands

### Using npm scripts:
```bash
# Deploy to staging
npm run deploy:pages:staging

# Deploy to production
npm run deploy:pages:production
```

### Using direct script:
```bash
# Deploy to staging
./scripts/deploy-pages.sh staging

# Deploy to production
./scripts/deploy-pages.sh production
```

### Using wrangler directly:
```bash
# Build first
npm run build:staging

# Deploy to staging
wrangler pages deploy build --project-name=trysnowball-v2 --env=preview

# Deploy to production
wrangler pages deploy build --project-name=trysnowball-v2 --env=production
```

## Testing URLs

### Staging
- **Primary**: https://staging.trysnowball.co.uk
- **Pages URL**: https://trysnowball-v2.pages.dev

### Production
- **Primary**: https://clean.trysnowball.co.uk (or main domain)
- **Pages URL**: https://trysnowball-v2.pages.dev (production branch)

## Post-Deployment Testing

### Automated Tests
```bash
# Run E2E tests against staging
npm run test:e2e:staging

# Run E2E tests against production
npm run cypress:run:production

# Run full test suite
npm run test:all
```

### Manual Verification
1. ✅ Landing page loads
2. ✅ Debt entry form works
3. ✅ Forecast generation works
4. ✅ Goals system functional
5. ✅ Multi-APR calculations correct
6. ✅ Analytics events firing
7. ✅ Responsive design on mobile

## Monitoring & Analytics

### PostHog Analytics
- **Staging**: Separate project for testing
- **Production**: Main analytics project
- **Events**: Goal achievements, debt calculations, user flows

### Error Monitoring
- Browser console errors tracked via PostHog
- Failed API calls monitored
- Performance metrics collected

## Troubleshooting

### Common Issues
1. **Build failures**: Check Node version is 18.17.0
2. **Environment variables**: Verify in CF dashboard
3. **Routing issues**: Check SPA redirect rules
4. **CORS errors**: Verify API base URLs
5. **Stripe errors**: Check test vs live mode keys

### Debug Commands
```bash
# Check wrangler authentication
wrangler whoami

# View project details
wrangler pages project list

# Check deployment status
wrangler pages deployment list --project-name=trysnowball-v2
```

## Next Steps

### Immediate
1. ✅ Configure custom domains in CF dashboard
2. ✅ Set environment variables in CF dashboard
3. ✅ Test deployment to staging
4. ✅ Run E2E tests
5. ✅ Deploy to production

### Future Enhancements
- [ ] Add preview deployments for feature branches
- [ ] Implement blue-green deployment strategy
- [ ] Add performance monitoring alerts
- [ ] Configure CDN cache rules optimization