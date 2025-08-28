#!/usr/bin/env bash
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ENVIRONMENT="${1:-staging}"

if [[ "$ENVIRONMENT" == "staging" ]]; then
  TARGET_BASE_URL="https://staging-trysnowball.pages.dev"
  STRIPE_MODE="test"
  WORKER_NAME="trysnowball-e2e-tests-staging"
elif [[ "$ENVIRONMENT" == "production" ]]; then
  TARGET_BASE_URL="https://trysnowball.co.uk"
  STRIPE_MODE="live"
  WORKER_NAME="trysnowball-e2e-tests-prod"
else
  echo -e "${RED}Usage: $0 staging|production${NC}"; exit 2
fi

echo -e "${YELLOW}🧪 TrySnowball Worker-based E2E Tests${NC}"
echo -e "Environment: ${ENVIRONMENT}"
echo -e "Target: ${TARGET_BASE_URL}"
echo ""

# Deploy E2E worker
echo -e "${YELLOW}📦 Deploying E2E worker: $WORKER_NAME${NC}"
cd cloudflare-workers
wrangler deploy trysnowball-e2e-worker.ts --config wrangler-e2e.toml --env "$ENVIRONMENT"
cd ..

# Wait for deployment propagation
sleep 3

# Get worker URL (use direct worker URL for now)
if [[ "$ENVIRONMENT" == "staging" ]]; then
  TEST_URL="https://${WORKER_NAME}.richbate.workers.dev/run-tests"
else
  TEST_URL="https://${WORKER_NAME}.richbate.workers.dev/run-tests"
fi

echo -e "${YELLOW}🚀 Running tests → $TEST_URL${NC}"

# Execute tests and capture results
RESP=$(curl -sS "$TEST_URL")
echo "$RESP" | jq '.'

# Check if tests passed
OK=$(echo "$RESP" | jq -r '.ok')
PASSED=$(echo "$RESP" | jq -r '.summary.passed // 0')
FAILED=$(echo "$RESP" | jq -r '.summary.failed // 0')
TOTAL=$(echo "$RESP" | jq -r '.summary.total // 0')

echo ""
if [[ "$OK" == "true" ]]; then
  echo -e "${GREEN}✅ E2E tests passed! ($PASSED/$TOTAL)${NC}"
  exit 0
else
  echo -e "${RED}❌ E2E tests failed ($FAILED failed, $PASSED passed, $TOTAL total)${NC}"
  exit 1
fi