#!/bin/bash

# Deploy to Staging Environment
# Script to build and deploy TrySnowball Clean v2 to staging

set -e

echo "🚀 Deploying TrySnowball Clean to Staging..."

# Load staging environment variables
if [ -f .env.staging ]; then
    export $(cat .env.staging | grep -v '^#' | xargs)
    echo "✅ Loaded staging environment variables"
else
    echo "❌ .env.staging file not found"
    exit 1
fi

# Build the application
echo "🔨 Building application for staging..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi

# Deploy to Cloudflare Pages (staging environment)
echo "📤 Deploying to Cloudflare Pages staging..."
npx wrangler pages deploy build --project-name=trysnowball-clean-staging --env=staging

# Check deployment status
if [ $? -eq 0 ]; then
    echo "🎉 Staging deployment completed successfully!"
    echo "🌐 Staging URL: https://staging.trysnowball.co.uk"
    echo ""
    echo "📋 Staging Environment Info:"
    echo "   - Environment: staging"
    echo "   - PostHog: Enabled (with environment filtering)"
    echo "   - Stripe: Test mode"
    echo "   - Analytics: Full tracking enabled"
    echo "   - Debug: Enabled"
    echo ""
    echo "🔗 Next steps:"
    echo "   1. Test the staging deployment"
    echo "   2. Verify analytics are working"
    echo "   3. Test payment flow (test mode)"
    echo "   4. Review environment banner display"
else
    echo "❌ Staging deployment failed"
    exit 1
fi