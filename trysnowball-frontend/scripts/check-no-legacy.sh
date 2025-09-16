#!/bin/bash
# CI Check: No Legacy Patterns
# Fails if forbidden legacy strings appear in source code

echo "🔍 Checking for legacy patterns that should not exist..."

# Define forbidden patterns (excluding migrations and dev tools)
FORBIDDEN_PATTERNS=(
    "trysnowball-user-data"
    "Storage\\.save"
    "localStorage\\.setItem.*debtBalances"
    "betaEnabled"
    "useBetaGate" 
    "BetaGateWrapper"
    "UpgradeLifetime"
    "\\bsetUserStorageKey\\b"
    "\\bgetUserStorageKey\\b"
    "localStorage\\.setItem.*'debt"
    "localStorage\\.setItem.*'trysnowball-theme'"
    "localStorage\\.getItem.*'trysnowball-theme'"
    "Intl\\.NumberFormat\\(['\"]\ben-GB\b['\"]\\)"
    "/me\\b"
    "/entitlement\\b"
    "trysnowball-analytics-events"
    "module\\.exports"
    "exports\\."
)

FOUND_ISSUES=0

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
    echo "Checking for: $pattern"
    
    # Search for pattern, exclude certain directories and files
    # Exclude migrations, dev tools, and test files
    MATCHES=$(grep -r "$pattern" src/ \
        --include="*.js" \
        --include="*.jsx" \
        --include="*.ts" \
        --include="*.tsx" \
        --exclude-dir=__tests__ \
        --exclude-dir=node_modules \
        --exclude-dir=migrations \
        --exclude-dir=dev \
        --exclude="*.test.*" \
        --exclude="*.spec.*" \
        --exclude="dataManager.js" \
        --exclude="formatCurrency.js" \
        -c 2>/dev/null | awk -F: '{sum+=$2} END {print sum+0}')
    
    if [[ "$MATCHES" =~ ^[0-9]+$ ]] && [ "$MATCHES" -gt 0 ]; then
        echo "❌ FOUND $MATCHES matches for forbidden pattern: $pattern"
        grep -r "$pattern" src/ \
            --include="*.js" \
            --include="*.jsx" \
            --include="*.ts" \
            --include="*.tsx" \
            --exclude-dir=__tests__ \
            --exclude-dir=node_modules \
            --exclude-dir=migrations \
            --exclude-dir=dev \
            --exclude="*.test.*" \
            --exclude="*.spec.*" \
            --exclude="dataManager.js" \
            --exclude="formatCurrency.js" \
            -n
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
        echo ""
    else
        echo "✅ No matches for: $pattern"
    fi
done

# Additional checks for specific anti-patterns

# Check for require() in source files (excluding tests and setupTests.js)
echo ""
echo "🔍 Checking for require() in source files..."
if grep -E "require\(" src \
    -r \
    --include="*.js" \
    --include="*.jsx" \
    --include="*.ts" \
    --include="*.tsx" \
    --exclude-dir=__tests__ \
    --exclude-dir=node_modules \
    --exclude="*.test.*" \
    --exclude="*.spec.*" \
    --exclude="setupTests.js" \
    -n; then
    echo "❌ Found require() in source files - use import instead!"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
else
    echo "✅ No require() found in source files"
fi
echo ""
echo "🔍 Checking for additional anti-patterns..."

# Check for direct .data access on managers (causes crashes)
echo "Checking for direct manager .data access..."
DATA_ACCESS=$(grep -rE "\\b(debtsManager|authManager|settingsManager)\\.data\\b" src/ \
    --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
    --exclude-dir=__tests__ --exclude-dir=migrations --exclude-dir=dev \
    --exclude="withNoDataGuard.js" \
    -c 2>/dev/null | awk -F: '{sum+=$2} END {print sum+0}')
if [ "$DATA_ACCESS" -gt 0 ]; then
    echo "❌ Found direct manager .data access (causes production crashes):"
    grep -rE "\\b(debtsManager|authManager|settingsManager)\\.data\\b" src/ \
        --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
        --exclude-dir=__tests__ --exclude-dir=migrations --exclude-dir=dev \
        --exclude="withNoDataGuard.js" -n
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
    echo "Use facade methods: getData(), getMetrics(), getUser(), etc."
else
    echo "✅ No direct .data access found"
fi

# Check for dataManager imports (should use debtsManager facade)
echo "Checking for legacy dataManager imports..."
DATAMGR_IMPORTS=$(grep -r "import.*dataManager\|from.*dataManager" src/ \
    --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
    --exclude-dir=__tests__ --exclude-dir=migrations \
    -c 2>/dev/null | awk -F: '{sum+=$2} END {print sum+0}')
if [ "$DATAMGR_IMPORTS" -gt 0 ]; then
    echo "❌ Found legacy dataManager imports (use debtsManager facade):"
    grep -r "import.*dataManager\|from.*dataManager" src/ \
        --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
        --exclude-dir=__tests__ --exclude-dir=migrations -n
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
fi

# Check for inline demo arrays (should use generateDemoDebts)
echo "Checking for inline demo data arrays..."
INLINE_DEMO=$(grep -r "Visa.*Credit.*Card\|PayPal.*Credit\|Student.*Loan.*£" src/lib/debtsManager.js src/data/localDebtStore.ts \
    2>/dev/null | wc -l | tr -d ' ')
if [ "$INLINE_DEMO" -gt 0 ]; then
    echo "❌ Found inline demo arrays (use generateDemoDebts from single source):"
    grep -n "Visa.*Credit.*Card\|PayPal.*Credit\|Student.*Loan.*£" src/lib/debtsManager.js src/data/localDebtStore.ts
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
fi

# Check for UI state mutations in data layer
echo "Checking for UI state mutations in data layer..."
UI_IN_DATA=$(grep -r "setRefreshNonce\|setState\|setData" src/lib/ src/data/ \
    --include="*.js" --include="*.ts" \
    --exclude="*test*" \
    -c 2>/dev/null | awk -F: '{sum+=$2} END {print sum+0}')
if [ "$UI_IN_DATA" -gt 0 ]; then
    echo "❌ Found UI state mutations in data layer (data should only persist):"
    grep -r "setRefreshNonce\|setState\|setData" src/lib/ src/data/ \
        --include="*.js" --include="*.ts" --exclude="*test*" -n
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
fi

echo ""
echo "🔍 Checking for additional anti-patterns..."

# Check for direct localStorage debt writes (should use localDebtStore)
LEGACY_STORAGE=$(grep -r "localStorage\\.setItem.*debt" src/ \
    --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
    --exclude-dir=__tests__ --exclude-dir=migrations --exclude-dir=dev \
    --exclude="dataManager.js" \
    -c 2>/dev/null | awk -F: '{sum+=$2} END {print sum+0}')
if [ "$LEGACY_STORAGE" -gt 0 ]; then
    echo "❌ Found direct localStorage debt writes (should use localDebtStore):"
    grep -r "localStorage\\.setItem.*debt" src/ \
        --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
        --exclude-dir=__tests__ --exclude="dataManager.js" -n
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
fi

# Check for import of removed files
REMOVED_IMPORTS=$(grep -r "import.*from.*['\"]\\.\\.\\?/.*BetaGate\|import.*from.*['\"]\\.\\.\\?/.*UpgradeLifetime" src/ \
    --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
    --exclude-dir=__tests__ -c | awk -F: '{sum+=$2} END {print sum+0}')
if [ "$REMOVED_IMPORTS" -gt 0 ]; then
    echo "❌ Found imports of removed Beta/UpgradeLifetime files:"
    grep -r "import.*from.*['\"]\\.\\.\\?/.*BetaGate\|import.*from.*['\"]\\.\\.\\?/.*UpgradeLifetime" src/ \
        --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
        --exclude-dir=__tests__ -n
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
fi

echo ""
if [ $FOUND_ISSUES -eq 0 ]; then
    echo "✅ All legacy pattern checks passed! No forbidden patterns found."
    exit 0
else
    echo "❌ Found $FOUND_ISSUES legacy pattern violations."
    echo ""
    echo "These patterns are forbidden to prevent regression:"
    echo "- trysnowball-user-data: Use localDebtStore, not legacy storage keys"
    echo "- Storage.save: Use localDebtStore, not legacy storage facade"
    echo "- betaEnabled/useBetaGate: Beta is retired, use Pro/Free model"
    echo "- UpgradeLifetime: Use Upgrade.jsx component instead"
    echo "- setUserStorageKey/getUserStorageKey: debtsManager is a pure facade"
    echo "- localStorage.setItem('debt: Use localDebtStore, not direct localStorage writes"
    echo "- localStorage theme: Use useSettings hook, not direct localStorage for theme"
    echo "- Intl.NumberFormat('en-GB'): Use formatCurrency(amount, settings) helper instead"
    echo "- /me and /entitlement: Legacy server endpoints removed, use local auth"
    echo "- trysnowball-analytics-events: Use IndexedDB analytics, not legacy localStorage"
    echo ""
    exit 1
fi