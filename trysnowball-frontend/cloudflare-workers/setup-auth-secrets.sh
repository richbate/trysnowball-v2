#!/bin/bash

# Setup script for TrySnowball Auth Worker Secrets
# Run this script to configure required secrets for the auth worker

echo "🔐 Setting up Auth Worker Secrets"
echo "================================="
echo ""
echo "This script will help you set up the required secrets for email authentication."
echo ""

# Check if we're in the right directory
if [ ! -f "auth-magic.js" ]; then
    echo "❌ Error: auth-magic.js not found. Please run this script from the cloudflare-workers directory."
    exit 1
fi

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_desc=$2
    local secret_example=$3
    
    echo ""
    echo "📝 $secret_desc"
    echo "   Example: $secret_example"
    echo -n "   Enter your $secret_name: "
    read -s secret_value
    echo ""
    
    if [ -z "$secret_value" ]; then
        echo "   ⚠️  Skipping $secret_name (no value provided)"
        return 1
    fi
    
    echo "$secret_value" | npx wrangler secret put $secret_name --env production
    
    if [ $? -eq 0 ]; then
        echo "   ✅ $secret_name set successfully"
        return 0
    else
        echo "   ❌ Failed to set $secret_name"
        return 1
    fi
}

echo "Setting up production secrets..."
echo "--------------------------------"

# 1. JWT Secret (required)
echo ""
echo "1️⃣  JWT_SECRET (Required)"
echo "   This is used to sign and verify JWT tokens."
echo "   You can generate one with: openssl rand -hex 32"
set_secret "JWT_SECRET" "JWT signing secret (32+ chars recommended)" "a1b2c3d4e5f6..."

# 2. SendGrid API Key (required for email sending)
echo ""
echo "2️⃣  SENDGRID_API_KEY (Required for email)"
echo "   Get your API key from: https://app.sendgrid.com/settings/api_keys"
echo "   Make sure it has 'Mail Send' permissions"
set_secret "SENDGRID_API_KEY" "SendGrid API Key" "SG.xxxxxxxxxxxx..."

# 3. Base URL (optional - defaults to trysnowball.co.uk)
echo ""
echo "3️⃣  BASE_URL (Optional)"
echo "   The base URL for magic links (defaults to https://trysnowball.co.uk)"
echo "   Press Enter to skip and use default"
set_secret "BASE_URL" "Base URL for magic links" "https://trysnowball.co.uk"

echo ""
echo "================================="
echo "🎉 Setup Complete!"
echo ""
echo "To verify your secrets are set, run:"
echo "  npx wrangler secret list --env production"
echo ""
echo "To test email sending:"
echo "  curl -X POST https://trysnowball.co.uk/auth/request-link \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"your-email@example.com\"}'"
echo ""
echo "If you need to update a secret later, use:"
echo "  npx wrangler secret put SECRET_NAME --env production"
echo ""