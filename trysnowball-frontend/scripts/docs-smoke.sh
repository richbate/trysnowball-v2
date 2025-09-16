#!/bin/bash
# 📚 Documentation Smoke Test
# Verifies all code examples in docs follow safe patterns

echo "🧪 Running documentation smoke test..."

FOUND_ISSUES=0

# Check that all code blocks importing debtsManager use safe facade methods
echo "🔍 Checking debtsManager usage in code blocks..."
UNSAFE_DEBTS=$(grep -A 10 -B 2 "debtsManager" docs/**/*.md *.md | grep -E "\.data\.|debtsManager\.data" | grep -v "❌\|Don't\|NEVER\|FORBIDDEN" || true)
if [ -n "$UNSAFE_DEBTS" ]; then
    echo "❌ Found unsafe debtsManager usage in docs:"
    echo "$UNSAFE_DEBTS"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
else
    echo "✅ All debtsManager usage is safe (uses getData/getMetrics)"
fi

# Check that localStorage only appears in "Don't do this" sections
echo "🔍 Checking localStorage references..."
UNSAFE_LOCALSTORAGE=$(grep -rE "localStorage\.(setItem|getItem)" docs/**/*.md *.md | grep -v "❌\|Forbidden\|Don't\|NEVER\|// ❌" || true)
if [ -n "$UNSAFE_LOCALSTORAGE" ]; then
    echo "❌ Found localStorage usage outside forbidden examples:"
    echo "$UNSAFE_LOCALSTORAGE"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
else
    echo "✅ localStorage only appears in forbidden examples"
fi

# Verify warning blocks are present in critical docs
echo "🔍 Checking for warning blocks in critical docs..."
CRITICAL_DOCS=(
    "README.md"
    "docs/ARCHITECTURE.md" 
    "docs/auth/AUTH_DEBUG_GUIDE.md"
    "WRANGLER.md"
)

for doc in "${CRITICAL_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        if ! grep -q "Do NOT access \`.data\`" "$doc"; then
            echo "❌ Missing .data warning in: $doc"
            FOUND_ISSUES=$((FOUND_ISSUES + 1))
        fi
    fi
done

# Check for safe pattern examples
echo "🔍 Checking for safe pattern examples..."
SAFE_PATTERNS=(
    "useDebts()"
    "useSettings()" 
    "await debtsManager.getData()"
    "await debtsManager.getMetrics()"
)

PATTERN_COUNT=0
for pattern in "${SAFE_PATTERNS[@]}"; do
    if grep -q "$pattern" docs/**/*.md *.md 2>/dev/null; then
        PATTERN_COUNT=$((PATTERN_COUNT + 1))
    fi
done

if [ $PATTERN_COUNT -lt 2 ]; then
    echo "❌ Not enough safe pattern examples found in documentation"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
else
    echo "✅ Safe patterns well-documented ($PATTERN_COUNT patterns found)"
fi

# Check that code blocks are properly formatted
echo "🔍 Checking code block formatting..."
MALFORMED_BLOCKS=$(grep -rE "```javascript|```js" docs/**/*.md *.md | grep -v "^[^:]*:```" || true)
# This is just a warning, not a failure
if [ -n "$MALFORMED_BLOCKS" ]; then
    echo "⚠️  Found potentially malformed code blocks (check manually)"
fi

echo ""
if [ $FOUND_ISSUES -eq 0 ]; then
    echo "✅ All documentation smoke tests passed!"
    echo "📚 Safe patterns enforced, no dangerous examples found"
    exit 0
else
    echo "❌ Found $FOUND_ISSUES documentation issues."
    echo "🔧 Fix the issues above and re-run the test."
    exit 1
fi