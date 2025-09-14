#!/bin/bash

# System Health Check - TrySnowball Production Validation
# Validates all endpoints, authentication, and database connectivity

set -e

echo "🏥 TrySnowball System Health Check"
echo "=================================="
echo

# Configuration
BASE_URL="https://trysnowball.co.uk"
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
SUCCESS_COUNT=0
TOTAL_TESTS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test result tracking
pass_test() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((SUCCESS_COUNT++))
    ((TOTAL_TESTS++))
}

fail_test() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    echo -e "${RED}   Error: $2${NC}"
    ((TOTAL_TESTS++))
}

warn_test() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    echo -e "${YELLOW}   Warning: $2${NC}"
    ((TOTAL_TESTS++))
}

info_test() {
    echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

echo "🔍 Starting health checks at $TIMESTAMP"
echo

# =============================================================================
# Phase 1: Basic Connectivity & Health Endpoints
# =============================================================================

echo "Phase 1: Health Endpoints"
echo "------------------------"

# Test main health endpoint (React app)
info_test "Testing main health endpoint..."
if curl -s "$BASE_URL/health" | grep -q "html"; then
    pass_test "Main site reachable"
else
    fail_test "Main site unreachable" "No HTML response from root"
fi

# Test auth worker health
info_test "Testing auth worker health..."
AUTH_HEALTH=$(curl -s "$BASE_URL/auth/health" 2>/dev/null || echo "ERROR")
if echo "$AUTH_HEALTH" | grep -q '"status":"ok"'; then
    pass_test "Auth worker healthy"
    
    # Extract endpoints from health response
    if echo "$AUTH_HEALTH" | grep -q '"database":"D1 connected"'; then
        pass_test "D1 database connected"
    else
        fail_test "D1 database connection" "Database not connected"
    fi
else
    fail_test "Auth worker unhealthy" "No status:ok response"
fi

# Test debts API health (might be 404)
info_test "Testing debts API health..."
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null || echo "000")
if [ "$API_HEALTH" = "200" ]; then
    pass_test "Debts API health endpoint exists"
elif [ "$API_HEALTH" = "404" ]; then
    warn_test "Debts API health endpoint missing" "Returns 404 but API might still work"
else
    fail_test "Debts API unreachable" "HTTP $API_HEALTH"
fi

echo

# =============================================================================
# Phase 2: Security & Authentication Enforcement
# =============================================================================

echo "Phase 2: Security Validation"
echo "---------------------------"

# Test auth enforcement on protected endpoints
info_test "Testing auth enforcement..."

# Should return 401 without auth
DEBTS_NO_AUTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/debts" 2>/dev/null || echo "000")
if [ "$DEBTS_NO_AUTH" = "401" ]; then
    pass_test "Debts API auth enforcement working"
else
    fail_test "Debts API auth enforcement broken" "Expected 401, got $DEBTS_NO_AUTH"
fi

AUTH_ME_NO_AUTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/me" 2>/dev/null || echo "000")
if [ "$AUTH_ME_NO_AUTH" = "401" ]; then
    pass_test "Auth /me endpoint enforcement working"
else
    fail_test "Auth /me endpoint enforcement broken" "Expected 401, got $AUTH_ME_NO_AUTH"
fi

echo

# =============================================================================
# Phase 3: Magic Link System
# =============================================================================

echo "Phase 3: Magic Link System"
echo "-------------------------"

info_test "Testing magic link request..."
MAGIC_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/request-link" \
    -H "Content-Type: application/json" \
    -d '{"email":"health-check@example.com"}' 2>/dev/null || echo "ERROR")

if echo "$MAGIC_RESPONSE" | grep -q "Magic link sent"; then
    pass_test "Magic link system working"
else
    fail_test "Magic link system broken" "No success message received"
fi

echo

# =============================================================================
# Phase 4: Database Connectivity & Schema
# =============================================================================

echo "Phase 4: Database Validation"
echo "---------------------------"

# This requires wrangler to be configured
if command -v wrangler >/dev/null 2>&1; then
    info_test "Testing database connectivity with wrangler..."
    
    # Try to get user count
    USER_COUNT=$(wrangler d1 execute auth_db --remote --command "SELECT COUNT(*) as count FROM users;" 2>/dev/null | grep -o '"count":[0-9]*' | cut -d':' -f2 || echo "ERROR")
    
    if [[ "$USER_COUNT" =~ ^[0-9]+$ ]]; then
        pass_test "Database query successful ($USER_COUNT users)"
        
        # Check debt table exists
        DEBT_CHECK=$(wrangler d1 execute auth_db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='debts';" 2>/dev/null | grep -o '"name":"debts"' || echo "")
        
        if [ -n "$DEBT_CHECK" ]; then
            pass_test "Debts table exists in database"
        else
            fail_test "Debts table missing" "Required table not found in schema"
        fi
        
    else
        warn_test "Database query failed" "Unable to execute test query (permissions?)"
    fi
else
    warn_test "Wrangler not available" "Cannot test database directly"
fi

echo

# =============================================================================
# Phase 5: CORS & Headers
# =============================================================================

echo "Phase 5: CORS & Security Headers"
echo "-------------------------------"

info_test "Checking CORS headers..."
CORS_HEADERS=$(curl -s -I "$BASE_URL/api/debts" 2>/dev/null | grep -i "access-control-allow" || echo "")
if [ -n "$CORS_HEADERS" ]; then
    pass_test "CORS headers present"
else
    warn_test "CORS headers missing" "May cause frontend issues"
fi

info_test "Checking security headers..."
SECURITY_HEADERS=$(curl -s -I "$BASE_URL/" 2>/dev/null | grep -i "strict-transport-security" || echo "")
if [ -n "$SECURITY_HEADERS" ]; then
    pass_test "Security headers present"
else
    warn_test "Security headers missing" "HTTPS security not optimal"
fi

echo

# =============================================================================
# Results Summary
# =============================================================================

echo "🏁 Health Check Complete"
echo "======================="
echo "Timestamp: $TIMESTAMP"
echo "Tests Passed: $SUCCESS_COUNT/$TOTAL_TESTS"

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 ALL SYSTEMS OPERATIONAL${NC}"
    exit 0
elif [ $SUCCESS_COUNT -gt $((TOTAL_TESTS * 3 / 4)) ]; then
    echo -e "${YELLOW}⚠️  MOSTLY OPERATIONAL (some issues detected)${NC}"
    exit 1
else
    echo -e "${RED}🚨 CRITICAL ISSUES DETECTED${NC}"
    exit 2
fi