#!/bin/bash

# Deploy to Production Environment
# Script to build and deploy TrySnowball Clean v2 to production

set -e

echo "🚀 Deploying TrySnowball Clean to Production..."
echo "⚠️  This will deploy to the LIVE production environment!"
echo ""

# Confirmation prompt
read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Production deployment cancelled"
    exit 1
fi

# Load production environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
    echo "✅ Loaded production environment variables"
else
    echo "❌ .env.production file not found"
    exit 1
fi

# Build the application
echo "🔨 Building application for production..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi

# Deploy to Cloudflare Pages (production environment)
echo "📤 Deploying to Cloudflare Pages production..."
npx wrangler pages deploy build --project-name=trysnowball-clean-production --env=production

# Check deployment status
if [ $? -eq 0 ]; then
    echo "🎉 Production deployment completed successfully!"
    echo "🌐 Production URL: https://trysnowball.co.uk"
    echo ""
    echo "📋 Production Environment Info:"
    echo "   - Environment: production"
    echo "   - PostHog: Enabled"
    echo "   - Stripe: LIVE mode"
    echo "   - Analytics: Full tracking enabled"
    echo "   - Debug: Disabled"
    echo "   - Environment banner: Hidden"
    echo ""
    echo "🔗 Post-deployment checklist:"
    echo "   1. ✅ Verify site loads correctly"
    echo "   2. ✅ Test critical user paths"
    echo "   3. ✅ Verify analytics are firing"
    echo "   4. ✅ Test payment flow (LIVE mode)"
    echo "   5. ✅ Monitor error logs"
else
    echo "❌ Production deployment failed"
    exit 1
fi