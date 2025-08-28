# PostHog Analytics Setup Guide

## ✅ What's Already Done
- PostHog JS SDK installed (v1.258.5)
- Analytics library created (`src/lib/posthog.js`)
- User identification on login/logout
- Debt management event tracking
- AI Coach usage tracking  
- Milestone achievement tracking
- Build tested successfully ✅

## 🔧 Setup Required

### 1. Create PostHog Account
1. Go to [posthog.com](https://posthog.com) and sign up
2. Create a new project
3. Copy your **Project API Key** from Project Settings

### 2. Update Environment Variables
Update your `.env` file:
```bash
REACT_APP_POSTHOG_KEY=phc_your_actual_key_here
REACT_APP_POSTHOG_HOST=https://us.i.posthog.com
```

### 3. Production Deployment
Add the same environment variables to Cloudflare Pages:
- `REACT_APP_POSTHOG_KEY` 
- `REACT_APP_POSTHOG_HOST`

## 📊 What Gets Tracked

### User Events
- **User Registration**: When users sign up via Magic Link
- **User Login**: Identifies returning users
- **User Properties**: Referral ID, signup date

### Debt Management
- **First Debt Added**: Special tracking for initial user engagement
- **Debt Added**: Each new debt with type and amount
- **Balance Updates**: Progress tracking (positive/negative)
- **Debt Milestones**: When users hit major milestones

### AI Coach Usage
- **Chat Started**: When users first interact with AI
- **Messages Sent**: User engagement with chat
- **GPT Responses**: Successful AI interactions
- **Offline Fallbacks**: When AI is unavailable

### Feature Usage
- **Page Views**: Automatic tracking
- **Tool Usage**: Which features are most popular
- **Milestone Sharing**: When users share achievements

## 🎯 Key Analytics You'll Get

1. **User Growth**: Registration trends, retention rates
2. **Feature Adoption**: Which tools users actually use
3. **User Journey**: From demo data → real debts → milestones
4. **Drop-off Points**: Where users leave the funnel
5. **AI Engagement**: How often users interact with coaching
6. **Conversion Tracking**: Demo users → engaged users

## 🚀 PostHog Features Available

- **Dashboards**: Custom analytics views
- **Funnels**: Track user progression
- **Cohort Analysis**: User behavior over time
- **Session Recordings**: See actual user interactions
- **Feature Flags**: A/B test new features
- **Heatmaps**: See where users click

## 🔒 Privacy & GDPR

PostHog is GDPR compliant and can be configured for privacy:
- Data stays in EU if needed
- User data can be deleted on request
- Anonymization options available
- Self-hosted option for complete control

## 🧪 Testing

Once configured, test with:
1. Add a new debt → Check "debt_added_first" event
2. Use AI coach → Check "ai_coach_message" events  
3. Update debt balance → Check "debt_balance_updated" events
4. Login/logout → Check user identification

Your analytics will be available in the PostHog dashboard within minutes!