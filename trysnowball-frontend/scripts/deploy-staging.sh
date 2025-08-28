#!/bin/bash
# Deploy to Staging Environment

echo "🚀 Deploying TrySnowball to Staging..."

# Build with staging environment
echo "📦 Building frontend with staging config..."
REACT_APP_ENVIRONMENT=staging npm run build

# Deploy workers to staging
echo "☁️ Deploying Cloudflare Workers to staging..."
cd cloudflare-workers
wrangler deploy --config wrangler.toml --env staging
wrangler deploy --config wrangler-checkout.toml --env staging
cd ..

echo "✅ Staging deployment complete!"
echo "🔗 Staging URL: https://staging.trysnowball.co.uk"
echo "🔗 Auth endpoints: https://staging.trysnowball.co.uk/auth/*"
echo "🔗 API endpoints: https://staging.trysnowball.co.uk/api/*"