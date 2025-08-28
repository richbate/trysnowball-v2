#!/usr/bin/env bash
# Magic Link Authentication Testing Script
# Provides automated verification of the auth flow

set -euo pipefail

BASE_URL="${1:-https://trysnowball.co.uk}"
TEST_EMAIL="demo@trysnowball.local"

echo "🔗 Testing Magic Link Authentication Flow"
echo "Environment: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Step 1: Test magic link request
echo "📧 Step 1: Requesting magic link..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X POST "$BASE_URL/auth/request-link" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$TEST_EMAIL\"}")

http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')

if [ "$http_code" -eq 200 ]; then
  echo "✅ Magic link request successful"
  echo "   Response: $body"
else
  echo "❌ Magic link request failed with status $http_code"
  echo "   Response: $body"
  exit 1
fi

# Extract magic link URL if present in debug mode
magic_link=$(echo "$body" | jq -r '.link // empty' 2>/dev/null || echo "")
if [ -n "$magic_link" ]; then
  echo "🔍 Debug magic link found: $magic_link"
  
  # Step 2: Test magic link verification
  echo ""
  echo "🔐 Step 2: Testing magic link verification..."
  
  # Extract token from magic link
  token=$(echo "$magic_link" | sed -n 's/.*token=\([^&]*\).*/\1/p')
  
  if [ -n "$token" ]; then
    echo "   Token extracted: ${token:0:20}..."
    
    # Test the verify endpoint
    verify_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
      "$BASE_URL/auth/verify?token=$token")
    
    verify_code=$(echo "$verify_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$verify_code" -eq 302 ]; then
      echo "✅ Magic link verification returns redirect (302)"
      
      # Extract redirect location if possible
      redirect_location=$(curl -s -I "$BASE_URL/auth/verify?token=$token" | grep -i location || echo "")
      if [ -n "$redirect_location" ]; then
        echo "   Redirects to: $redirect_location"
        
        # Check if redirects to correct path
        if echo "$redirect_location" | grep -q "/auth/success"; then
          echo "✅ Redirects to correct LoginSuccess page"
        else
          echo "❌ Redirects to wrong location (expected /auth/success)"
        fi
      fi
    else
      echo "❌ Magic link verification failed with status $verify_code"
      verify_body=$(echo "$verify_response" | sed 's/HTTPSTATUS:[0-9]*$//')
      echo "   Response: $verify_body"
    fi
  else
    echo "⚠️  Could not extract token from magic link"
  fi
else
  echo "⚠️  No debug magic link in response (production mode - check email)"
fi

# Step 3: Test auth endpoints
echo ""
echo "🛡️  Step 3: Testing auth endpoints..."

# Test /auth/me without token
me_response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/auth/me")
me_code=$(echo "$me_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)

if [ "$me_code" -eq 401 ]; then
  echo "✅ /auth/me correctly returns 401 without token"
else
  echo "⚠️  /auth/me returned $me_code (expected 401 without token)"
fi

# Test health endpoint
health_response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/auth/health")
health_code=$(echo "$health_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)

if [ "$health_code" -eq 200 ]; then
  echo "✅ Auth service health check passed"
  health_body=$(echo "$health_response" | sed 's/HTTPSTATUS:[0-9]*$//')
  endpoints=$(echo "$health_body" | jq -r '.endpoints[]? // empty' 2>/dev/null | tr '\n' ' ' || echo "")
  echo "   Available endpoints: $endpoints"
else
  echo "❌ Auth service health check failed with status $health_code"
fi

echo ""
echo "📋 Test Summary:"
echo "   Magic Link Request: $([ "$http_code" -eq 200 ] && echo "✅ PASS" || echo "❌ FAIL")"
if [ -n "$magic_link" ] && [ -n "$token" ]; then
  echo "   Magic Link Verify:  $([ "$verify_code" -eq 302 ] && echo "✅ PASS" || echo "❌ FAIL")"
fi
echo "   Auth Service:       $([ "$health_code" -eq 200 ] && echo "✅ PASS" || echo "❌ FAIL")"

echo ""
echo "🧪 Next Steps for Complete Testing:"
echo "1. Open browser dev tools (F12)"
echo "2. Go to $BASE_URL and request magic link for $TEST_EMAIL"
echo "3. Click magic link and monitor network tab for redirect flow"
echo "4. Check localStorage.getItem('token') in console"
echo "5. Verify no 401 errors when navigating authenticated pages"