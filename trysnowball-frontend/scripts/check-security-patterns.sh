#!/bin/bash
# Check for dangerous patterns that could introduce CSP violations

echo "🔍 Checking for dangerous security patterns..."

# Check for eval usage
if grep -rn "\beval(" src/; then
    echo "❌ Found eval() usage - CSP violation risk"
    exit 1
fi

# Check for new Function usage
if grep -rn "new Function(" src/; then
    echo "❌ Found new Function() usage - CSP violation risk"
    exit 1
fi

# Check for dangerouslySetInnerHTML
if grep -rn "dangerouslySetInnerHTML" src/; then
    echo "⚠️  Found dangerouslySetInnerHTML usage - review required"
    # Don't exit 1 here as this might be legitimate usage
fi

# Check for string timers
if grep -rn -E "(setTimeout|setInterval)\s*\(\s*['\"]" src/; then
    echo "❌ Found string timer usage - equivalent to eval()"
    exit 1
fi

# Check for document.write (another XSS vector)
if grep -rn "document\.write" src/; then
    echo "❌ Found document.write usage - XSS risk"
    exit 1
fi

# Check for innerHTML assignments
if grep -rn -E "\.innerHTML\s*=" src/; then
    echo "⚠️  Found innerHTML assignment - review for XSS risk"
    # Don't exit 1 here as this might be legitimate usage in some contexts
fi

echo "✅ Security pattern check passed"

# Run critical vulnerability check
echo "🔍 Checking for critical vulnerabilities..."
if ! npm run audit:critical > /dev/null 2>&1; then
    echo "❌ Critical vulnerabilities found - run 'npm audit' for details"
    exit 1
fi

echo "✅ No critical vulnerabilities found"