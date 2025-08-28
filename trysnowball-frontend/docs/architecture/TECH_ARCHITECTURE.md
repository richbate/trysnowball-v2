# TrySnowball - Technical Architecture

**Version**: 2.0.0  
**Last Updated**: January 2025  
**Architecture**: Dual Storage with Cloud-First Authentication  

## 🏗️ System Overview

TrySnowball uses a modern React architecture with dual storage capabilities, offering both privacy-focused local storage for demo users and cloud storage for authenticated users. The system is built on Cloudflare's edge infrastructure for global performance and reliability.

## 📊 Architecture Diagram

```
┌─────────────────────┐    ┌───────────────────────┐    ┌──────────────────────┐
│   React Frontend    │    │  Cloudflare Workers   │    │   Cloudflare D1      │
│   (Cloudflare Pages)│◄──►│                       │◄──►│   (SQLite)           │
└─────────────────────┘    │  - Auth API           │    │                      │
                           │  - Debts API          │    │  - user_debts        │
┌─────────────────────┐    │  - Stripe Webhooks    │    │  - user_payments     │
│   Browser Storage   │    │  - Analytics API      │    │  - user_profiles     │
│   (Demo Users)      │    │                       │    │  - stripe_customers  │
└─────────────────────┘    └───────────────────────┘    │  - payment_events    │
                                                        └──────────────────────┘
```

## 🎯 Core Components

### 1. Frontend Application (React 18)

**Hosting**: Cloudflare Pages  
**Framework**: React 18 with functional components and hooks  
**Routing**: React Router DOM v6  
**Styling**: TailwindCSS  
**State Management**: React Context + useReducer  

#### Key Directories:
```
src/
├── components/           # Reusable UI components
│   ├── ai/              # AI-related components
│   ├── charts/          # Data visualization
│   └── debt/            # Debt management widgets
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── lib/                 # Core business logic
├── pages/               # Route components
└── utils/               # Helper functions and utilities
```

### 2. Cloudflare Workers (Serverless API)

**Runtime**: V8 JavaScript Engine  
**Database**: Cloudflare D1 (SQLite)  
**Authentication**: JWT with refresh tokens  
**Payment Processing**: Stripe integration  

#### API Endpoints:
```
/auth/*                  # Authentication endpoints
/api/debts/*             # Debt CRUD operations  
/api/payments/*          # Payment history management
/api/analytics/*         # Usage tracking
/webhooks/stripe/*       # Payment processing webhooks
```

### 3. Database Schema (Cloudflare D1)

**Technology**: SQLite via Cloudflare D1  
**Scaling**: Automatic with edge distribution  
**Performance**: Indexed queries with materialized views  

#### Core Tables:
- `user_debts` - Individual debt records with full history
- `user_payments` - Payment tracking and milestones
- `user_profiles` - User settings and preferences
- `stripe_customers` - Payment integration data
- `payment_events` - Webhook processing log

## 🔄 Data Flow Architecture

### Demo Users (Privacy-First)
```
User Input → React State → localStorage → Chart Rendering
                      ↓
                Browser Analytics (PostHog)
```

### Authenticated Users (Cloud Storage)
```
User Input → React State → Cloudflare Worker API → D1 Database
                      ↓                    ↓
            Browser Analytics     Server Analytics
```

## 🔐 Authentication & Authorization

### JWT Authentication System
- **Access Tokens**: 24-hour expiry, contains user metadata
- **Refresh Tokens**: 30-day expiry, secure httpOnly cookies
- **User Tiers**: Free, Pro Subscription, Founders (one-time)

### Authorization Matrix
| Feature | Demo | Free | Pro | Founders |
|---------|------|------|-----|----------|
| Basic Debt Tracking | ✅ | ✅ | ✅ | ✅ |
| Cloud Storage | ❌ | ✅ | ✅ | ✅ |
| AI Coach | ❌ | ❌ | ✅ | ✅ |
| AI Reports | ❌ | ❌ | ✅ | ✅ |
| Advanced Charts | ❌ | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ | ✅ |

## 📱 Frontend Architecture

### State Management Pattern
```javascript
// Centralized state with Context API
const UserContext = createContext();

// Data management hooks pattern
const useDebts = () => {
  const { user } = useContext(UserContext);
  return user ? useCloudDebts() : useDemoDebts();
};
```

### Component Architecture
```
App.jsx
├── UserContextProvider       # Authentication & user state
├── Router                   # Page routing
│   ├── PublicRoutes         # Landing, pricing, login
│   ├── AuthenticatedRoutes  # Dashboard, settings, billing
│   └── ProOnlyRoutes        # AI features, advanced analytics
└── GlobalComponents         # Toasts, modals, debug panels
```

### Hook-Based Architecture
- `useDebts()` - Debt management with dual storage routing
- `useAuth()` - Authentication state and operations  
- `useAnalytics()` - Event tracking with privacy controls
- `useBilling()` - Stripe integration and subscription management
- `useAI()` - GPT integration with usage tracking

## 🛡️ Security Architecture

### Data Protection Layers
1. **Transit Security**: TLS 1.3 for all communications
2. **Authentication**: JWT with secure refresh mechanism
3. **Authorization**: Route-level and feature-level gating
4. **Input Validation**: Client and server-side validation
5. **Privacy Controls**: User-configurable analytics exclusion

### Privacy Implementation
```javascript
// Demo users: completely local
if (!user) {
  return localStorage.getItem('trysnowball-guest-data');
}

// Authenticated: server-side with user consent
if (user.settings.allowCloudStorage) {
  return await api.getUserData(user.id);
}
```

## 🚀 Deployment Architecture

### Frontend Deployment (Cloudflare Pages)
```
GitHub Repository → Automatic Build → Global CDN Distribution
                                   ↓
                            Edge Locations Worldwide
```

**Build Process**:
1. GitHub push triggers Cloudflare Pages build
2. React app compiled with environment-specific configs
3. Static assets distributed to global CDN
4. Instant rollback capabilities maintained

### Backend Deployment (Cloudflare Workers)
```
Local Development → Wrangler CLI → Cloudflare Worker Runtime
                               ↓
                        Global Edge Distribution
```

**Deployment Commands**:
```bash
# Deploy with secrets
wrangler secret put JWT_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler deploy --env production
```

## 📊 Performance Architecture

### Frontend Optimizations
- **Code Splitting**: Route-based chunking for faster loading
- **Lazy Loading**: AI components loaded on-demand
- **Image Optimization**: WebP with fallbacks
- **Bundle Analysis**: Webpack bundle analyzer for size monitoring

### Backend Performance
- **Edge Distribution**: Workers run at 200+ global locations
- **D1 Optimizations**: Indexed queries with prepared statements
- **Caching Strategy**: CDN caching for static assets
- **Connection Pooling**: Efficient database connection management

### Monitoring & Metrics
- **Core Web Vitals**: LCP, FID, CLS monitoring
- **API Response Times**: P95 latency under 100ms
- **Database Performance**: Query execution time tracking
- **Error Tracking**: Automatic error reporting and alerting

## 🔧 Development Architecture

### Local Development Setup
```bash
# Frontend development
npm start                    # React dev server (localhost:3000)
npm run build               # Production build
npm run test                # Jest test suite

# Backend development  
cd cloudflare-workers
wrangler dev                # Local worker development
wrangler tail               # Live log streaming
```

### Environment Management
```javascript
// Environment-specific configuration
const config = {
  development: {
    apiUrl: 'http://localhost:8787',
    analytics: false,
    debugMode: true
  },
  production: {
    apiUrl: 'https://api.trysnowball.com',
    analytics: true,
    debugMode: false
  }
};
```

### Testing Strategy
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Cypress for critical user flows
- **Performance Tests**: Lighthouse CI integration

## 🔄 Data Migration Architecture

### Storage Migration Pattern
```javascript
// Automatic data structure evolution
function migrateUserData(data) {
  if (!data.metadata?.version) {
    return migrateLegacyData(data);
  }
  
  return applyVersionMigrations(data);
}
```

### Database Migration System
```sql
-- Versioned schema changes
CREATE TABLE migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  checksum TEXT NOT NULL
);
```

## 🔌 Third-Party Integration Architecture

### Stripe Integration
- **Subscription Management**: Automatic billing and renewal
- **Webhook Processing**: Secure signature verification
- **Payment Methods**: Cards, digital wallets, SEPA
- **Compliance**: PCI DSS compliant processing

### AI Integration (OpenAI)
- **Privacy-First**: No data retention on OpenAI servers
- **Rate Limiting**: Per-user request limits
- **Fallback Systems**: Graceful degradation when AI unavailable
- **Usage Tracking**: Token consumption monitoring

### Analytics Integration
- **PostHog**: Privacy-focused product analytics
- **Google Analytics 4**: Traditional web analytics
- **Custom Events**: Business-specific tracking
- **Privacy Controls**: User opt-out capabilities

## 📋 Scalability Considerations

### Current Capacity
- **Users**: 100,000+ concurrent users supported
- **Database**: Multi-TB storage with automatic scaling  
- **API Requests**: 1M+ requests per day capacity
- **Global Latency**: <100ms P95 response times

### Scaling Strategies
- **Horizontal Scaling**: Cloudflare Workers auto-scale
- **Database Sharding**: User-based data distribution
- **CDN Optimization**: Aggressive caching strategies
- **Queue Processing**: Background job processing

## 🔗 Related Documentation

- **[Data Model](./DATA_MODEL.md)** - Complete database schema and relationships
- **[AI System](./AI_SYSTEM.md)** - GPT integration and privacy controls  
- **[Operations](./OPERATIONS.md)** - Deployment and debugging procedures
- **[Analytics](./ANALYTICS.md)** - Tracking implementation and privacy
- **[Subscriptions](./SUBSCRIPTIONS.md)** - Billing and tier management

---

*This architecture balances performance, privacy, and scalability while maintaining developer productivity and user experience excellence.*