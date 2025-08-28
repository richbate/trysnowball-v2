#!/usr/bin/env bash
set -euo pipefail

base="https://trysnowball.co.uk/auth"
echo "🔍 Testing auth endpoints..."

echo -n "Health: "
curl -fsS "$base/health" | jq . >/dev/null && echo "✅ OK"

echo -n "Verify(401): "
code=$(curl -s -o /dev/null -w "%{http_code}" "$base/verify?token=test")
[[ "$code" == "401" ]] && echo "✅ OK" || (echo "❌ FAIL $code"; exit 1)

echo -n "Request link: "
curl -fsS -X POST "$base/request-link" -H 'Content-Type: application/json' -d '{"email":"demo@trysnowball.local"}' | jq . >/dev/null && echo "✅ OK"

echo "✅ All auth endpoints working correctly"