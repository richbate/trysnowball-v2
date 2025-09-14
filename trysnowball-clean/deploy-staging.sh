#!/bin/bash

# Deploy TrySnowball Clean v2 to Staging
# This script deploys both the frontend (Pages) and backend (Workers)

set -e

echo "🚀 Deploying TrySnowball Clean v2 to Staging..."

# Build staging version
echo "📦 Building staging version..."
npm run build:staging

# Create Pages project if it doesn't exist
echo "📄 Setting up Cloudflare Pages project..."
if ! wrangler pages project list | grep -q "trysnowball-clean-staging"; then
  echo "Creating Pages project..."
  wrangler pages project create trysnowball-clean-staging
else
  echo "Pages project already exists"
fi

# Deploy to Pages
echo "🚀 Deploying to Cloudflare Pages..."
wrangler pages deploy build --project-name=trysnowball-clean-staging --compatibility-date=2024-11-20

# Deploy Workers (backend APIs)
echo "🔧 Deploying backend Workers..."
cd ../trysnowball-frontend/cloudflare-workers/

# Deploy auth worker
echo "  → Deploying auth worker..."
wrangler deploy --env staging

# Deploy debts API worker
echo "  → Deploying debts API worker..."
wrangler deploy -c wrangler-debts.toml --env staging

# Deploy other workers if they exist
if [ -f "wrangler-checkout.toml" ]; then
  echo "  → Deploying checkout API worker..."
  wrangler deploy -c wrangler-checkout.toml --env staging
fi

if [ -f "wrangler-user-settings.toml" ]; then
  echo "  → Deploying user settings worker..."
  wrangler deploy -c wrangler-user-settings.toml --env staging
fi

cd ../../trysnowball-clean/

echo "✅ Deployment complete!"
echo ""
echo "🌐 Staging URL: https://staging.trysnowball.co.uk"
echo "🔍 Check deployment status: wrangler pages deployment list --project-name=trysnowball-clean-staging"
echo "📊 View logs: wrangler pages tail --project-name=trysnowball-clean-staging"
echo ""
echo "Next steps:"
echo "1. Configure custom domain staging.trysnowball.co.uk in Cloudflare Dashboard"
echo "2. Set up DNS record: staging.trysnowball.co.uk → CNAME → trysnowball-clean-staging.pages.dev"
echo "3. Test the staging environment"
echo "4. Configure password protection via Cloudflare Access (optional)"