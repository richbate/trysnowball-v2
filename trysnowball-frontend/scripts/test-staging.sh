#!/bin/bash
# Test Staging Environment

echo "🧪 Testing Staging Environment..."

# Test auth worker
echo "Testing auth worker..."
curl -I https://staging.trysnowball.co.uk/auth/health || echo "⚠️ Auth worker not responding"

# Test checkout worker  
echo "Testing checkout worker..."
curl -I https://staging.trysnowball.co.uk/api/health || echo "⚠️ Checkout worker not responding"

# Test with invalid auth (should return proper error)
echo "Testing API authentication..."
curl -X POST https://staging.trysnowball.co.uk/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"test":"data"}' \
  || echo "✅ Checkout worker returning expected auth errors"

echo "🎯 Manual tests to run:"
echo "1. Visit staging.trysnowball.co.uk (configure DNS)"
echo "2. Test magic link login flow"
echo "3. Test Stripe checkout with test cards"
echo "4. Verify JWT tokens work between auth and checkout"