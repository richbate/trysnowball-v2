# TrySnowball - Operations & Deployment Guide

**Version**: 2.0.0  
**Last Updated**: January 2025  
**Infrastructure**: Cloudflare Pages + Workers + D1  

## 🚀 Deployment Overview

TrySnowball uses Cloudflare's edge infrastructure for global performance and reliability. The system consists of a React frontend hosted on Cloudflare Pages and a serverless backend using Cloudflare Workers with D1 SQLite database.

## 🏗️ Infrastructure Components

### Frontend (Cloudflare Pages)
- **Hosting**: Cloudflare Pages with global CDN
- **Build**: Automatic GitHub integration
- **Domain**: Custom domain with SSL/TLS
- **Performance**: Edge caching and optimization

### Backend (Cloudflare Workers)
- **Runtime**: V8 JavaScript engine at 200+ locations
- **Database**: Cloudflare D1 (distributed SQLite)
- **Authentication**: JWT with refresh tokens
- **Payments**: Stripe webhook processing

### Third-Party Services
- **Payments**: Stripe for subscription management
- **AI**: OpenAI GPT-4 integration
- **Analytics**: PostHog + Google Analytics 4
- **Email**: Planned future integration

## 📋 Deployment Checklist

### Prerequisites
```bash
# Install required tools
npm install -g wrangler@latest
npm install -g gh
git --version
node --version
```

### Initial Setup
```bash
# Clone repository
git clone https://github.com/your-org/trysnowball-frontend
cd trysnowball-frontend

# Install dependencies
npm install

# Setup Cloudflare Workers
cd cloudflare-workers
npm install
wrangler login
```

### Environment Configuration

#### Frontend Environment Variables (Cloudflare Pages)
```bash
# Production Environment
REACT_APP_API_BASE_URL=https://api.trysnowball.com
REACT_APP_POSTHOG_KEY=your_posthog_key
REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
REACT_APP_OPENAI_API_KEY=sk-xxxxx

# Development Environment  
REACT_APP_API_BASE_URL=http://localhost:8787
REACT_APP_POSTHOG_KEY=your_dev_posthog_key
REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
REACT_APP_OPENAI_API_KEY=sk-xxxxx
```

#### Backend Secrets (Cloudflare Workers)
```bash
# Set production secrets
wrangler secret put JWT_SECRET --env production
wrangler secret put JWT_REFRESH_SECRET --env production
wrangler secret put STRIPE_SECRET_KEY --env production
wrangler secret put STRIPE_WEBHOOK_SECRET --env production
wrangler secret put OPENAI_API_KEY --env production

# Set development secrets
wrangler secret put JWT_SECRET --env development
wrangler secret put JWT_REFRESH_SECRET --env development
wrangler secret put STRIPE_SECRET_KEY --env development
wrangler secret put STRIPE_WEBHOOK_SECRET --env development
wrangler secret put OPENAI_API_KEY --env development
```

## 🛠️ Development Workflow

### Local Development Setup
```bash
# Terminal 1: Frontend development server
npm start

# Terminal 2: Backend development server
cd cloudflare-workers
wrangler dev --env development

# Terminal 3: Database console (optional)
wrangler d1 execute trysnowball-db --local --command "SELECT * FROM user_profiles;"
```

### Development Environment URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8787
- **Database**: Local D1 instance

### Code Quality & Testing
```bash
# Run tests
npm test                     # Frontend unit tests
npm run test:e2e            # Cypress end-to-end tests

# Code quality
npm run lint                # ESLint checking
npm run lint:fix           # Auto-fix linting issues
npm run format             # Prettier formatting

# Build verification
npm run build              # Production build
npm run build:analyze      # Bundle size analysis
```

## 🚀 Production Deployment

### Automated Deployment (Recommended)
```bash
# Frontend deployment (automatic via GitHub)
git push origin main
# Cloudflare Pages automatically builds and deploys

# Backend deployment
cd cloudflare-workers
wrangler deploy --env production
```

### Manual Deployment Steps

#### 1. Database Migration
```bash
# Apply database migrations
cd cloudflare-workers
wrangler d1 migrations apply trysnowball-db --env production

# Verify migration
wrangler d1 execute trysnowball-db --env production --command "SELECT version FROM migrations ORDER BY applied_at DESC LIMIT 1;"
```

#### 2. Backend Deployment
```bash
# Deploy with environment
wrangler deploy --env production

# Verify deployment
curl https://api.trysnowball.com/health
```

#### 3. Frontend Deployment
```bash
# Build and verify
npm run build
npm run test:build

# Deploy via Cloudflare Pages (automatic)
git push origin main

# Or manual deployment
npx wrangler pages deploy build --project-name trysnowball-frontend
```

### Deployment Verification
```bash
# Health checks
curl https://api.trysnowball.com/health
curl https://trysnowball.com/health

# Authentication test
curl -X POST https://api.trysnowball.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@trysnowball.local","password":"testpass123"}'

# Database connectivity
wrangler d1 execute trysnowball-db --env production --command "SELECT COUNT(*) as user_count FROM user_profiles;"
```

## 📊 Monitoring & Logging

### Application Monitoring

#### Cloudflare Analytics
- **Real User Monitoring**: Core Web Vitals tracking
- **Performance Metrics**: Response times and availability
- **Security Events**: DDoS protection and firewall logs
- **Usage Analytics**: Bandwidth and request patterns

#### Custom Health Checks
```javascript
// src/utils/healthCheck.js
export const performHealthCheck = async () => {
  const checks = {
    api: false,
    database: false,
    stripe: false,
    openai: false
  };
  
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    return { ...checks, ...data };
  } catch (error) {
    return { ...checks, error: error.message };
  }
};
```

### Logging Strategy

#### Frontend Logging
```javascript
// src/utils/logger.js
const logger = {
  info: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data);
    }
    // Send to monitoring service in production
  },
  
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error);
    // Send to error tracking service
  },
  
  performance: (metric, value) => {
    // Track performance metrics
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: metric,
        value: value
      });
    }
  }
};
```

#### Backend Logging
```javascript
// cloudflare-workers/utils/logger.js
export const log = {
  info: (message, data) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      data,
      timestamp: new Date().toISOString()
    }));
  },
  
  error: (message, error) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }));
  }
};
```

### Real-time Monitoring
```bash
# Stream live logs
wrangler tail --env production

# Filter specific events
wrangler tail --env production --grep "ERROR"

# Monitor specific worker
wrangler tail auth-api --env production
```

## 🔧 Database Operations

### Daily Operations

#### Database Backups
```bash
# Export full database
wrangler d1 export trysnowball-db --env production --output backup-$(date +%Y%m%d).sql

# Backup specific tables
wrangler d1 execute trysnowball-db --env production --command ".backup backup.db"
```

#### Performance Monitoring
```sql
-- Check database size
SELECT 
  name,
  COUNT(*) as record_count,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
GROUP BY name;

-- Monitor slow queries
SELECT 
  user_id,
  COUNT(*) as debt_count,
  AVG(balance) as avg_balance,
  MAX(updated_at) as last_update
FROM user_debts 
GROUP BY user_id
HAVING COUNT(*) > 10;
```

#### Index Optimization
```sql
-- Monitor index usage
EXPLAIN QUERY PLAN SELECT * FROM user_debts WHERE user_id = 'user123';

-- Rebuild indexes if needed
REINDEX INDEX idx_user_debts_user_id;
```

### Database Migrations

#### Creating Migrations
```javascript
// cloudflare-workers/migrations/001_add_user_settings.sql
ALTER TABLE user_profiles ADD COLUMN notification_preferences TEXT DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';

-- Update migration log
INSERT INTO migrations (version, description, checksum) VALUES 
('2.1.0', 'Add user settings columns', 'abc123def456');
```

#### Running Migrations
```bash
# Apply pending migrations
wrangler d1 migrations apply trysnowball-db --env production

# Rollback if needed (manual process)
wrangler d1 execute trysnowball-db --env production --file rollback-2.1.0.sql
```

## 🚨 Incident Response

### Emergency Procedures

#### Service Outage Response
1. **Identify Issue**: Check Cloudflare dashboard and logs
2. **Assess Impact**: Determine affected users and features
3. **Immediate Action**: Switch to maintenance mode if needed
4. **Communication**: Update status page and notify users
5. **Resolution**: Apply fix and monitor recovery
6. **Post-mortem**: Document lessons learned

#### Rollback Procedures
```bash
# Frontend rollback (via Cloudflare Pages)
# 1. Go to Cloudflare Pages dashboard
# 2. Select previous successful deployment
# 3. Click "Rollback to this deployment"

# Backend rollback
wrangler rollback auth-api --env production
wrangler rollback stripe-api --env production

# Database rollback (if needed)
wrangler d1 execute trysnowball-db --env production --file rollback.sql
```

### Common Issues & Solutions

#### High Response Times
```bash
# Check worker performance
wrangler tail --env production --grep "duration"

# Monitor database queries
wrangler d1 execute trysnowball-db --env production --command "
  SELECT sql, execution_time 
  FROM sqlite_master 
  WHERE type='table';
"

# Scale up if needed (automatic with Cloudflare)
```

#### Database Connection Issues
```bash
# Check D1 status
wrangler d1 list

# Test connectivity
wrangler d1 execute trysnowball-db --env production --command "SELECT 1 as test;"

# Check for locks
wrangler d1 execute trysnowball-db --env production --command "
  SELECT name, sql FROM sqlite_master WHERE type='table';
"
```

#### Authentication Problems
```bash
# Check JWT secrets
wrangler secret list --env production

# Test auth endpoint
curl -X POST https://api.trysnowball.com/auth/check \
  -H "Authorization: Bearer YOUR_TOKEN"

# Monitor auth logs
wrangler tail auth-api --env production --grep "auth"
```

## 📈 Performance Optimization

### Frontend Optimizations

#### Bundle Size Management
```bash
# Analyze bundle size
npm run build:analyze

# Check for large dependencies
npx webpack-bundle-analyzer build/static/js/*.js
```

#### Caching Strategy
```javascript
// Cache configuration in _headers file
/*
  Cache-Control: max-age=31536000, immutable

/*.html
  Cache-Control: max-age=300

/api/*
  Cache-Control: no-cache
```

### Backend Optimizations

#### Query Optimization
```javascript
// Use prepared statements
const stmt = db.prepare('SELECT * FROM user_debts WHERE user_id = ?');
const debts = await stmt.all(userId);

// Batch operations
const batch = db.batch([
  stmt1.bind(param1),
  stmt2.bind(param2),
  stmt3.bind(param3)
]);
await batch;
```

#### Connection Pooling
```javascript
// Reuse database connections
let dbConnection = null;

export async function getDatabase() {
  if (!dbConnection) {
    dbConnection = new Database(env.DB);
  }
  return dbConnection;
}
```

## 🔐 Security Operations

### Security Monitoring

#### Access Logs
```bash
# Monitor authentication attempts
wrangler tail auth-api --env production --grep "login_attempt"

# Check for suspicious patterns
wrangler tail --env production --grep "rate_limit_exceeded"
```

#### Security Headers
```javascript
// cloudflare-workers/middleware/security.js
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com"
};
```

### Regular Security Tasks

#### Certificate Management
- **SSL/TLS**: Automatic via Cloudflare Universal SSL
- **Monitoring**: Cloudflare dashboard alerts
- **Renewal**: Automatic, no manual intervention required

#### Secret Rotation
```bash
# Rotate JWT secrets (quarterly)
wrangler secret put JWT_SECRET --env production
wrangler secret put JWT_REFRESH_SECRET --env production

# Rotate API keys (as needed)
wrangler secret put STRIPE_SECRET_KEY --env production
wrangler secret put OPENAI_API_KEY --env production
```

## 📊 Analytics & Reporting

### Business Metrics Dashboard

#### Key Performance Indicators
```javascript
// Analytics tracking implementation
const trackKPI = {
  userSignup: () => {
    posthog.capture('user_signed_up');
    gtag('event', 'sign_up');
  },
  
  debtAdded: (debtCount, totalBalance) => {
    posthog.capture('debt_added', {
      debt_count: debtCount,
      total_balance: totalBalance
    });
  },
  
  subscriptionCreated: (tier) => {
    posthog.capture('subscription_created', { tier });
    gtag('event', 'purchase', {
      currency: 'GBP',
      value: tier === 'pro' ? 5.99 : 79
    });
  }
};
```

#### Automated Reports
```bash
# Weekly usage report
wrangler d1 execute trysnowball-db --env production --command "
  SELECT 
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as total_debts,
    SUM(balance) as total_balance
  FROM user_debts 
  WHERE updated_at > datetime('now', '-7 days');
"
```

### Error Tracking & Alerting

#### Error Monitoring Setup
```javascript
// Error boundary with reporting
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to monitoring service
    logger.error('React Error Boundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }
}
```

#### Automated Alerts
```yaml
# Example alert configuration
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    duration: 5m
    notification: email, slack
    
  - name: Database Connection Issues
    condition: db_connection_errors > 10
    duration: 1m
    notification: email, pager
```

## 🔗 Related Documentation

- **[Technical Architecture](./TECH_ARCHITECTURE.md)** - System architecture overview
- **[Data Model](./DATA_MODEL.md)** - Database schema and data structures
- **[Analytics](./ANALYTICS.md)** - Tracking and measurement setup
- **[Subscriptions](./SUBSCRIPTIONS.md)** - Billing and payment operations
- **[AI System](./AI_SYSTEM.md)** - AI integration and monitoring

---

*This operations guide ensures reliable deployment, monitoring, and maintenance of the TrySnowball application across all environments.*