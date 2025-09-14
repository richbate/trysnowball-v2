#!/bin/bash

# TrySnowball Clean v2 - Cloudflare Pages Deployment Script
# Usage: ./scripts/deploy-pages.sh [staging|production]

set -e  # Exit on any error

ENVIRONMENT=${1:-staging}
PROJECT_NAME="trysnowball-v2"

echo "🚀 Deploying TrySnowball Clean v2 to Cloudflare Pages"
echo "📊 Environment: $ENVIRONMENT"
echo "🔧 Project: $PROJECT_NAME"
echo ""

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Error: Environment must be 'staging' or 'production'"
    echo "Usage: $0 [staging|production]"
    exit 1
fi

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: Wrangler CLI not found. Install with: npm install -g wrangler"
    exit 1
fi

# Check authentication
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Error: Not authenticated with Cloudflare"
    echo "Please run: wrangler login"
    exit 1
fi

WRANGLER_USER=$(wrangler whoami | grep -o '[^ ]*@[^ ]*' | head -1)
echo "✅ Authenticated as: $WRANGLER_USER"

# Set build command based on environment
if [[ "$ENVIRONMENT" == "production" ]]; then
    BUILD_CMD="build:production"
    PAGES_ENV="production"
else
    BUILD_CMD="build:staging"
    PAGES_ENV="preview"  # Cloudflare Pages uses 'preview' for non-production
fi

echo ""
echo "🏗️  Building application for $ENVIRONMENT..."
npm run $BUILD_CMD

# Check if build was successful
if [[ ! -d "build" ]]; then
    echo "❌ Error: Build directory not found. Build may have failed."
    exit 1
fi

echo "✅ Build completed successfully"
echo ""

# Deploy to Cloudflare Pages
echo "☁️  Deploying to Cloudflare Pages..."

if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "🔴 PRODUCTION DEPLOYMENT"
    echo "This will deploy to the production environment."
    read -p "Are you sure you want to continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi

    # Deploy to production
    wrangler pages deploy build \
        --project-name="$PROJECT_NAME" \
        --env="$PAGES_ENV" \
        --compatibility-date="2024-01-01"
else
    # Deploy to staging/preview
    wrangler pages deploy build \
        --project-name="$PROJECT_NAME" \
        --env="$PAGES_ENV" \
        --compatibility-date="2024-01-01"
fi

echo ""
echo "🎉 Deployment completed successfully!"

# Show deployment info
echo ""
echo "📋 Deployment Information:"
echo "   Project: $PROJECT_NAME"
echo "   Environment: $ENVIRONMENT"
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "   URL: https://clean.trysnowball.co.uk"
else
    echo "   URL: https://staging.trysnowball.co.uk"
    echo "   Preview URL: https://$PROJECT_NAME.pages.dev"
fi

echo ""
echo "🔗 Cloudflare Dashboard:"
echo "   https://dash.cloudflare.com/?to=/:account/pages/view/$PROJECT_NAME"

# Run post-deployment checks
echo ""
echo "🧪 Running post-deployment checks..."

# Wait a moment for deployment to propagate
sleep 5

if [[ "$ENVIRONMENT" == "production" ]]; then
    HEALTH_CHECK_URL="https://clean.trysnowball.co.uk"
else
    HEALTH_CHECK_URL="https://staging.trysnowball.co.uk"
fi

# Basic health check
echo "🏥 Checking deployment health: $HEALTH_CHECK_URL"
if curl -s -f -o /dev/null "$HEALTH_CHECK_URL"; then
    echo "✅ Health check passed - site is responding"
else
    echo "⚠️  Health check failed - site may not be ready yet"
    echo "   Check deployment status in Cloudflare dashboard"
fi

echo ""
echo "🏁 Deployment process complete!"

# Show next steps
echo ""
echo "📝 Next Steps:"
if [[ "$ENVIRONMENT" == "staging" ]]; then
    echo "   1. Test the staging deployment"
    echo "   2. Run E2E tests: npm run test:e2e:staging"
    echo "   3. Deploy to production: ./scripts/deploy-pages.sh production"
else
    echo "   1. Monitor production deployment"
    echo "   2. Check analytics and error rates"
    echo "   3. Verify all critical user flows"
fi