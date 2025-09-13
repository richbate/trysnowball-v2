#!/bin/bash
# CP-5 API Testing Script
# Basic curl commands to test the API endpoints

API_BASE="http://localhost:8787"
TEST_TOKEN="Bearer test-jwt-token-here"

echo "🧪 CP-5 API Testing"
echo "==================="

echo
echo "📋 Health Check"
curl -X GET "$API_BASE/health" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

echo
echo "📋 List Goals (should require auth)"
curl -X GET "$API_BASE/api/v2/goals" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

echo
echo "📋 List Goals (with auth)"
curl -X GET "$API_BASE/api/v2/goals" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TEST_TOKEN" \
  -w "\nStatus: %{http_code}\n"

echo
echo "📋 Create Goal"
curl -X POST "$API_BASE/api/v2/goals" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TEST_TOKEN" \
  -d '{"type":"debt_clear","target_value":5000,"forecast_debt_id":"debt_test"}' \
  -w "\nStatus: %{http_code}\n"

echo
echo "📋 Invalid Route"
curl -X GET "$API_BASE/api/v2/invalid" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

echo
echo "✅ API Testing Complete"