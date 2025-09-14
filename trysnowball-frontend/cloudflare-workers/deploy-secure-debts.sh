#!/bin/bash

# Deploy Secure Debts API to Cloudflare Workers
# Run from cloudflare-workers directory

set -e

echo "🔐 Deploying Secure Debts API..."

# Check if ENCRYPTION_KEY is set in environment or secrets
echo "⚠️  Make sure secrets are set (NEVER commit these values):"
echo "   wrangler secret put MASTER_KEY_V1 --config wrangler-debts.toml"
echo "   wrangler secret put METRICS_HMAC_KEY --config wrangler-debts.toml"
echo "   wrangler secret put JWT_SECRET --config wrangler-debts.toml"
echo ""

# Deploy to staging first
echo "📦 Deploying to staging..."
npx wrangler deploy --config wrangler-debts.toml --env staging

echo ""
read -p "✅ Staging deployed. Deploy to production? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to production..."
    npx wrangler deploy --config wrangler-debts.toml --env production
    echo "✅ Production deployment complete!"
else
    echo "⏸️  Production deployment skipped."
fi

echo ""
echo "🔗 API Endpoints:"
echo "   Staging: https://staging-trysnowball.pages.dev/api/debts"
echo "   Production: https://trysnowball.co.uk/api/debts"
echo ""
echo "🧪 Test encryption:"
echo "   POST /api/crypto/test (requires auth header)"
echo ""
echo "📚 Remember to run the D1 migration:"
echo "   npx wrangler d1 execute auth_db --file=../migrations/002_secure_debts.sql"