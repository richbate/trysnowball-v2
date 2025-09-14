# Maintenance Mode Configuration

## Overview
The maintenance mode system allows you to temporarily disable access to the application while performing upgrades or debugging. Users will see a professional holding page with an email waitlist instead of the normal app.

## Configuration Methods

### 1. PostHog Feature Flag (Recommended for Production)
**Priority: Highest**

1. Log into your PostHog dashboard
2. Go to Feature Flags
3. Create or find the flag named `maintenance-mode`
4. Toggle it on/off as needed
5. Changes take effect immediately without deployment

**Advantages:**
- No code deployment required
- Instant on/off toggle
- Can target specific users or percentages
- Centralized control across multiple environments

### 2. Environment Variable (Emergency Override)
**Priority: Highest (overrides everything)**

```bash
REACT_APP_MAINTENANCE_MODE=true npm start
```

Or in `.env` file:
```
REACT_APP_MAINTENANCE_MODE=true
```

**Use Case:** Emergency maintenance when PostHog is unavailable

### 3. Static Config File
**Priority: Lowest (fallback)**

Edit `src/config/flags.js`:
```javascript
export const FLAGS = {
  MAINTENANCE_MODE: true,  // Toggle this
};
```

**Use Case:** Development and testing

## Priority Order
1. Environment variable (`REACT_APP_MAINTENANCE_MODE`)
2. PostHog feature flag (`maintenance-mode`)
3. Static config (`FLAGS.MAINTENANCE_MODE`)

## Testing Locally

1. Enable via config:
   ```javascript
   // src/config/flags.js
   MAINTENANCE_MODE: true,
   ```

2. Refresh the app - you should see the maintenance page

3. Test email collection:
   - Enter an email
   - Submit the form
   - Check localStorage: `localStorage.getItem('waitlist')`

## PostHog Setup

1. Create a feature flag in PostHog:
   - Key: `maintenance-mode`
   - Type: Boolean
   - Default: false

2. Optional rollout strategies:
   - **Percentage rollout**: Show to X% of users
   - **User targeting**: Show to specific user IDs
   - **Property matching**: Show based on user properties

## Monitoring

When maintenance mode is active:
- Emails are collected in localStorage (temporary)
- Consider setting up a backend endpoint to persist emails
- Monitor PostHog for any users still accessing the app

## Features of the Maintenance Page

- ❄️ TrySnowball branding
- Gradient background (matches brand)
- Clear messaging about upgrades
- Email collection with validation
- Success confirmation
- Expected downtime display
- Support contact information
- Mobile responsive design

## Quick Commands

**Enable maintenance (PostHog):**
```javascript
// In browser console (if PostHog is loaded)
posthog.featureFlags.override({'maintenance-mode': true})
```

**Disable maintenance (PostHog):**
```javascript
posthog.featureFlags.override({'maintenance-mode': false})
```

**Check current state:**
```javascript
// In browser console
console.log('Maintenance Mode:', posthog.isFeatureEnabled('maintenance-mode'))
```

## Production Checklist

Before enabling maintenance mode in production:
- [ ] Notify users in advance if possible
- [ ] Set up email collection backend (if needed)
- [ ] Test the maintenance page appearance
- [ ] Confirm support email is monitored
- [ ] Document expected downtime
- [ ] Have a rollback plan ready