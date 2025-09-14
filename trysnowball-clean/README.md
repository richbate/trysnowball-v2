# TrySnowball V2

Intelligent debt management and payoff acceleration for UK consumers.

## 📚 Documentation

All project documentation is maintained in Linear Project Documents for better organization, discoverability, and maintenance:

**[📖 View All Documentation →](https://linear.app/trysnowball/documents)**

### Quick Links
- [🚀 Setup & Development](https://linear.app/trysnowball/document/setup-development)
- [🏗️ System Architecture](https://linear.app/trysnowball/document/cp-0-system-overview)
- [🧮 CP Calculation Engines](https://linear.app/trysnowball/document/cp-series-overview)
- [🔧 API Documentation](https://linear.app/trysnowball/document/api-documentation)
- [🚀 Deployment Guide](https://linear.app/trysnowball/document/cloudflare-pages-deployment)
- [🧪 Testing Strategy](https://linear.app/trysnowball/document/testing-strategy)

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Environment-Specific Builds
```bash
# Build for staging
npm run build:staging

# Build for production
npm run build:production
```

### Deployment
```bash
# Deploy to staging
npm run deploy:pages:staging

# Deploy to production
npm run deploy:pages:production
```

## 🏗️ System Overview

TrySnowball V2 is built on a modular architecture with:

- **CP-1**: Clean Debt Model - Canonical debt structure and validation
- **CP-3**: Multi-APR Bucket System - Per-debt interest calculations
- **CP-4**: Forecast Engine V2 - Composite simulation engine
- **CP-5**: Goals Engine - User-defined financial goals (upcoming)

For detailed technical information, see our [System Architecture](https://linear.app/trysnowball/document/cp-0-system-overview) documentation.

## 🤝 Contributing

- **Documentation**: All docs maintained in [Linear Project Documents](https://linear.app/trysnowball/documents)
- **Issues**: Track work in [Linear Issues](https://linear.app/trysnowball/issues)
- **Development**: See [Development Setup Guide](https://linear.app/trysnowball/document/setup-development)
- **CP System**: Follow [CP Documentation Standards](https://linear.app/trysnowball/document/cp-series-overview)

## 📊 Project Management

This project uses Linear for comprehensive project management:
- **Issues & Tasks**: [linear.app/trysnowball](https://linear.app/trysnowball)
- **Documentation**: [Linear Project Documents](https://linear.app/trysnowball/documents)
- **Progress Tracking**: All features and bugs tracked in Linear

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, TailwindCSS
- **Charts**: Recharts for data visualization
- **Analytics**: PostHog for user insights
- **Deployment**: Cloudflare Pages
- **Testing**: Jest, Cypress, Golden test scenarios

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Development server on http://localhost:3000 |
| `npm test` | Run test suite in watch mode |
| `npm run build` | Production build to `/build` |
| `npm run build:staging` | Staging build with staging env vars |
| `npm run build:production` | Production build with production env vars |
| `npm run deploy:pages:staging` | Deploy to staging environment |
| `npm run deploy:pages:production` | Deploy to production environment |
| `npm run test:golden` | Run golden test scenarios |
| `npm run test:e2e` | Run end-to-end tests with Cypress |

## 🔗 Key Resources

- **Production**: [https://trysnowball.co.uk](https://trysnowball.co.uk)
- **Staging**: [https://staging.trysnowball.co.uk](https://staging.trysnowball.co.uk)
- **Documentation**: [Linear Project Documents](https://linear.app/trysnowball/documents)
- **Issue Tracking**: [Linear Workspace](https://linear.app/trysnowball)
- **Deployment Config**: See `CLOUDFLARE_PAGES_CONFIG.md`

---

For detailed information, please refer to our comprehensive documentation in Linear Project Documents.