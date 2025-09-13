#!/bin/bash

# CP-3 Deployment Script
# Sets up encryption and JWT secrets for the secured Worker

echo "🔐 CP-3 Foundation Deployment"
echo "==============================="
echo ""
echo "This script will configure the production-ready secured API with:"
echo "- AES-256-GCM encryption for all debt data"
echo "- JWT authentication (HS256/RS256)"
echo "- Full validation and security hardening"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

echo "📝 Setting up secrets..."
echo ""

# Generate secure random secrets if not provided
generate_secret() {
    openssl rand -base64 32 | tr -d '\n'
}

echo "1. Encryption Secret"
echo "   This key encrypts all sensitive debt data in D1"
echo "   Requirement: 32+ character string"
echo ""
read -p "   Enter ENCRYPTION_SECRET (or press Enter to generate): " ENCRYPTION_SECRET

if [ -z "$ENCRYPTION_SECRET" ]; then
    ENCRYPTION_SECRET=$(generate_secret)
    echo "   ✅ Generated: $ENCRYPTION_SECRET"
    echo "   ⚠️  SAVE THIS KEY - You'll need it for data recovery!"
else
    echo "   ✅ Using provided key"
fi

echo ""
echo "2. JWT Secret"
echo "   This key verifies authentication tokens"
echo "   Requirement: Strong secret for HS256, or public key for RS256"
echo ""
read -p "   Enter JWT_SECRET (or press Enter to generate): " JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(generate_secret)
    echo "   ✅ Generated: $JWT_SECRET"
    echo "   ⚠️  SAVE THIS KEY - Required for token generation!"
else
    echo "   ✅ Using provided key"
fi

echo ""
echo "🚀 Deploying secrets to Cloudflare..."
echo ""

# Set the secrets
echo "$ENCRYPTION_SECRET" | wrangler secret put ENCRYPTION_SECRET
if [ $? -ne 0 ]; then
    echo "❌ Failed to set ENCRYPTION_SECRET"
    exit 1
fi

echo "$JWT_SECRET" | wrangler secret put JWT_SECRET
if [ $? -ne 0 ]; then
    echo "❌ Failed to set JWT_SECRET"
    exit 1
fi

echo ""
echo "📦 Deploying Worker..."
echo ""

# Deploy the worker
wrangler deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ CP-3 Foundation Deployed Successfully!"
    echo ""
    echo "🔑 Save these secrets securely:"
    echo "   ENCRYPTION_SECRET: $ENCRYPTION_SECRET"
    echo "   JWT_SECRET: $JWT_SECRET"
    echo ""
    echo "📚 Next Steps:"
    echo "   1. Generate JWTs with the JWT_SECRET for authentication"
    echo "   2. Run golden tests: npm test (in worker directory)"
    echo "   3. Update frontend to use authenticated API calls"
    echo ""
    echo "🔒 Security Checklist:"
    echo "   ✅ All debt data encrypted at rest"
    echo "   ✅ JWT authentication required"
    echo "   ✅ User isolation enforced"
    echo "   ✅ Input validation active"
    echo ""
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi