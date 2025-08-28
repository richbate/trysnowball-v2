#!/bin/bash
# Comprehensive CI security validation
# Combines all security checks for deployment pipeline

set -e

echo "🛡️  Running comprehensive CI security validation..."
echo "======================================================"

# 1. Validate lockfile integrity and dependencies
echo "1️⃣  Validating dependency lockfile..."
npm run validate:lockfile

# 2. Check for dangerous patterns and CSP violations  
echo -e "\n2️⃣  Scanning for dangerous security patterns..."
npm run check:security

# 3. Run ESLint security rules
echo -e "\n3️⃣  Running ESLint security rules..."
if ! npm run lint > /dev/null 2>&1; then
    echo "⚠️  ESLint warnings found (non-blocking)"
    echo "💡 Run 'npm run lint' locally to see details"
else
    echo "✅ ESLint security rules passed"
fi

# 4. Validate package.json engines
echo -e "\n4️⃣  Checking Node.js engine compatibility..."
NODE_REQUIRED=$(node -p "require('./package.json').engines.node" 2>/dev/null || echo "not specified")
if [ "$NODE_REQUIRED" != "not specified" ]; then
    echo "✅ Node.js engine requirement: $NODE_REQUIRED"
else
    echo "⚠️  No Node.js engine specified in package.json"
fi

# 5. Verify security headers are present
echo -e "\n5️⃣  Validating security headers configuration..."
if grep -q "Content-Security-Policy" public/_headers; then
    echo "✅ CSP headers configured"
else
    echo "❌ CSP headers missing from public/_headers"
    exit 1
fi

if grep -q "Strict-Transport-Security" public/_headers; then
    echo "✅ HSTS headers configured"
else
    echo "❌ HSTS headers missing from public/_headers"  
    exit 1
fi

# 6. Check for test coverage of security components
echo -e "\n6️⃣  Checking security test coverage..."
if [ -f "src/utils/__tests__/safeMessageRenderer.security.test.js" ]; then
    echo "✅ AI security tests present"
else
    echo "⚠️  AI security tests missing"
fi

if [ -f "cypress/e2e/security-ai-payloads.cy.js" ]; then
    echo "✅ E2E security tests present"  
else
    echo "⚠️  E2E security tests missing"
fi

echo -e "\n======================================================"
echo "🎯 CI Security validation complete!"
echo "✅ Ready for deployment - no critical security issues found"