#!/bin/bash
# Check for legacy code patterns that should not exist
# Run in CI to fail builds that reintroduce old patterns

set -e

FOUND_ISSUES=0

echo "🔍 Checking for legacy code patterns..."

# Check for legacy useDebts hook (excluding the shim itself)
echo "→ Checking for legacy useDebts imports..."
if grep -RIn "from.*useDebts" src --exclude="useDebts.js" --exclude="*.test.*" 2>/dev/null | grep -v "useUserDebts"; then
  echo "❌ Found legacy useDebts imports"
  FOUND_ISSUES=1
else
  echo "✅ No legacy useDebts imports found"
fi

# Check for legacy field names in JavaScript/TypeScript files
echo "→ Checking for legacy debt field names..."
LEGACY_FIELDS=$(grep -RIn "\\.balance\>\\|\\.interestRate\>\\|\\.minPayment\>" src \
  --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
  --exclude="*.test.*" --exclude="*debtValidation*" --exclude="*migration*" 2>/dev/null || true)

if [ -n "$LEGACY_FIELDS" ]; then
  echo "❌ Found legacy field usage:"
  echo "$LEGACY_FIELDS" | head -10
  echo "   Use: amount_cents, apr_bps, min_payment_cents instead"
  FOUND_ISSUES=1
else
  echo "✅ No legacy field names found"
fi

# Check for direct posthog.capture bypassing secureAnalytics
echo "→ Checking for direct posthog.capture calls..."
DIRECT_POSTHOG=$(grep -RIn "posthog\\.capture" src \
  --exclude="*secureAnalytics*" --exclude="*.test.*" 2>/dev/null || true)

if [ -n "$DIRECT_POSTHOG" ]; then
  echo "❌ Found direct posthog.capture calls:"
  echo "$DIRECT_POSTHOG" | head -5
  echo "   Use secureAnalytics.* functions instead"
  FOUND_ISSUES=1
else
  echo "✅ No direct posthog.capture calls found"
fi

# Check API responses for legacy fields (if running with a test token)
if [ -n "$TEST_API_TOKEN" ]; then
  echo "→ Checking API response format..."
  API_RESPONSE=$(curl -sS -H "Authorization: Bearer $TEST_API_TOKEN" \
    "${API_BASE_URL:-http://localhost:8787}/api/debts?limit=1" 2>/dev/null || echo "{}")
  
  if echo "$API_RESPONSE" | jq -e '.[0] | has("balance") or has("interest_rate") or has("min_payment") or has("amount") or has("apr_pct")' >/dev/null 2>&1; then
    echo "❌ API returns legacy fields"
    echo "$API_RESPONSE" | jq '.[0]' | head -10
    FOUND_ISSUES=1
  else
    echo "✅ API returns normalized fields only"
  fi
fi

# Final result
echo ""
if [ $FOUND_ISSUES -eq 0 ]; then
  echo "✅ All checks passed! No legacy patterns found."
  exit 0
else
  echo "❌ Found legacy patterns. Please migrate to new patterns:"
  echo "   - Use useUserDebts instead of useDebts"
  echo "   - Use amount_cents/apr_bps/min_payment_cents instead of balance/interestRate/minPayment"
  echo "   - Use secureAnalytics instead of direct posthog.capture"
  exit 1
fi