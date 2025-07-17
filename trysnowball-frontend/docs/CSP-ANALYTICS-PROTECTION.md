# CSP Analytics Protection Documentation

## Overview

This document outlines the Content Security Policy (CSP) requirements and protection mechanisms for Google Analytics in the TrySnowball application. **Analytics are CRITICAL for business decisions** and must be protected from accidental breakage.

## Why This Matters

Google Analytics provides essential business intelligence:
- User behavior tracking
- Conversion funnel analysis
- Revenue attribution
- Performance metrics
- User journey mapping

Any CSP changes that break analytics directly impact business decision-making capabilities.

## Required CSP Directives

### Essential Domains

The following domains **MUST** be allowed in CSP headers:

```
script-src:
  - https://www.googletagmanager.com

connect-src:
  - https://www.google-analytics.com
  - https://www.googletagmanager.com
  - https://*.google-analytics.com (for regional domains)
```

### Current Working CSP Configuration

**File: `public/_headers`**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com;
```

**File: `public/index.html` (backup)**
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com;" />
```

## Protection Mechanisms

### 1. CSP Validation Script

**Location:** `scripts/validate-csp.js`

This script validates CSP headers to ensure analytics compatibility:

```bash
npm run validate-csp
```

Features:
- Parses CSP from both `_headers` and `index.html`
- Validates required analytics domains
- Checks for Google Analytics tracking ID
- Provides detailed error messages

### 2. Pre-commit Hook

**Location:** `.husky/pre-commit`

Automatically runs before every commit to:
- Detect CSP-related file changes
- Validate analytics compatibility
- Block commits that would break analytics
- Provide helpful error messages

### 3. Build-time Validation

**Package.json integration:**
```json
{
  "scripts": {
    "prebuild": "npm run validate-csp"
  }
}
```

Every build automatically validates CSP before deployment.

### 4. Comprehensive Test Suite

**Location:** `src/tests/analytics.test.js`

Tests cover:
- Google Analytics script loading
- Page view tracking
- Custom event tracking
- Error handling
- Business-critical analytics events

## Common Issues and Solutions

### Issue: Regional Google Analytics Blocked

**Error:** `region1.google-analytics.com` blocked by CSP

**Solution:** Use wildcard domain `https://*.google-analytics.com` in `connect-src`

### Issue: Script Loading Blocked

**Error:** GTM script fails to load

**Solution:** Ensure `https://www.googletagmanager.com` is in `script-src`

### Issue: Font Loading Errors

**Error:** Data URI fonts blocked

**Solution:** Include `font-src 'self' data:` in CSP

## Historical Context

### Breaking Change: July 14, 2025

**Commit:** `38ffb13b` - Added restrictive CSP without analytics domains

**Impact:** Completely blocked Google Analytics tracking

**Resolution:** Added required analytics domains to CSP configuration

### Previous Issues

1. **Regional Domains:** Initially only allowed `www.google-analytics.com`, missed regional variants
2. **Font Loading:** CSP blocked data URI fonts causing console errors
3. **Script Sources:** Missing GTM domain in script-src directive

## Best Practices

### Before Modifying CSP

1. **Always run validation:** `npm run validate-csp`
2. **Test in staging:** Verify analytics work after CSP changes
3. **Check console:** Look for CSP violation errors
4. **Monitor tracking:** Confirm events are reaching GA4

### During Development

1. **Use the pre-commit hook:** Don't bypass CSP validation
2. **Check both files:** Ensure `_headers` and `index.html` are consistent
3. **Test analytics events:** Verify custom tracking still works

### After CSP Changes

1. **Deploy to staging first:** Test analytics functionality
2. **Monitor console errors:** Check for new CSP violations
3. **Verify tracking:** Confirm events appear in GA4 Real-Time reports

## Emergency Procedures

### If Analytics Are Broken

1. **Identify the change:** Check recent commits affecting CSP
2. **Validate current CSP:** Run `npm run validate-csp`
3. **Quick fix:** Add missing domains to CSP
4. **Test immediately:** Verify analytics work in production

### Rollback Process

1. **Revert CSP changes:** `git revert <commit-hash>`
2. **Validate fix:** Run CSP validation
3. **Deploy urgently:** Analytics are business-critical
4. **Monitor recovery:** Check GA4 for resumed tracking

## Testing Checklist

Before any CSP modification:

- [ ] Run `npm run validate-csp`
- [ ] Run analytics tests: `npm test -- --testPathPattern=analytics`
- [ ] Check console for CSP violations
- [ ] Verify GA4 tracking in browser dev tools
- [ ] Test custom event tracking
- [ ] Confirm real-time reports show data

## Contact and Support

For CSP-related issues:
1. Check this documentation first
2. Run validation script for specific errors
3. Review console for CSP violation details
4. Test in staging environment before production

Remember: **Analytics are vital to the business.** When in doubt, prioritize maintaining analytics functionality over restrictive security policies.