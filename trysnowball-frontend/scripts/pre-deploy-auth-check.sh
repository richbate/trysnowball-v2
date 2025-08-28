#!/usr/bin/env bash
# Pre-deploy guardrail for auth worker
set -euo pipefail

echo "🔒 Running pre-deploy auth checks..."

# Fail if we accidentally reintroduce duplicates
count=$(ls cloudflare-workers/auth*.js 2>/dev/null | wc -l | tr -d ' ')
if [ "$count" -ne 1 ]; then
  echo "❌ Expected exactly one auth*.js file (auth-magic.js). Found: $count"
  ls -la cloudflare-workers/auth*.js 2>/dev/null || true
  exit 1
fi

# Ensure wrangler points to the same file
if ! grep -q 'main *= *"auth-magic.js"' cloudflare-workers/wrangler.toml; then
  echo "❌ wrangler.toml main is not auth-magic.js"
  grep "main.*=" cloudflare-workers/wrangler.toml || true
  exit 1
fi

# Check for the loud header
if ! grep -q "SINGLE SOURCE OF TRUTH" cloudflare-workers/auth-magic.js; then
  echo "❌ Missing SINGLE SOURCE OF TRUTH header in auth-magic.js"
  exit 1
fi

echo "✅ All auth pre-deploy checks passed"