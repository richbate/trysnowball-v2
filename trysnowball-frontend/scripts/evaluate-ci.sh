#!/bin/bash

# Fail-Fast CI Evaluation Script
# Stops at first critical failure to save CI time and provide fast feedback

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create reports directory
mkdir -p reports coverage

log "🚀 Starting fail-fast CI evaluation..."

# Step 1: Lint (critical - code quality gate)
log "📋 Running ESLint..."
if ! npm run lint; then
    error "❌ Linting failed - blocking deployment"
    exit 1
fi
success "✅ Linting passed"

# Step 2: Contract tests (critical - feature invariants)
log "📋 Running contract tests..."
if ! npm run test:contracts -- --runInBand --ci; then
    error "❌ Contract tests failed - core features broken"
    exit 1
fi
success "✅ Contract tests passed"

# Step 3: Property-based tests (critical - math correctness)
log "🎲 Running property-based tests..."
if ! npm run test:property -- --runInBand --ci; then
    error "❌ Property tests failed - math functions broken"
    exit 1
fi
success "✅ Property tests passed"

# Step 4: Config tests (critical - environment setup)
log "⚙️  Running config tests..."
if ! npm run test:config -- --runInBand --ci; then
    error "❌ Config tests failed - environment issues"
    exit 1
fi
success "✅ Config tests passed"

# Step 5: Build (critical - deployment readiness)
log "🏗️  Running production build..."
if ! npm run build:ci; then
    error "❌ Build failed - cannot deploy"
    exit 1
fi
success "✅ Build passed"

# Step 6: Golden master tests (critical - output consistency)
log "📸 Running golden master tests..."
if ! npm run test:golden -- --runInBand --ci; then
    error "❌ Golden master tests failed - output regression detected"
    exit 1
fi
success "✅ Golden master tests passed"

# Generate coverage report (non-blocking but informative)
log "📊 Generating coverage report..."
if ! npm run test:contracts -- --coverage --runInBand --ci --silent; then
    warning "⚠️  Coverage collection had issues but not blocking"
fi

# Check coverage thresholds
log "🎯 Checking coverage thresholds..."
if [ -f "coverage/coverage-summary.json" ]; then
    # Extract coverage percentages (simplified check)
    if command -v jq >/dev/null 2>&1; then
        LINES=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
        FUNCTIONS=$(jq -r '.total.functions.pct' coverage/coverage-summary.json)
        BRANCHES=$(jq -r '.total.branches.pct' coverage/coverage-summary.json)
        
        log "📈 Coverage: Lines ${LINES}%, Functions ${FUNCTIONS}%, Branches ${BRANCHES}%"
        
        # Check thresholds (lines >= 85%, functions >= 80%, branches >= 70%)
        if (( $(echo "$LINES < 85" | bc -l) )) || (( $(echo "$FUNCTIONS < 80" | bc -l) )) || (( $(echo "$BRANCHES < 70" | bc -l) )); then
            warning "⚠️  Coverage below thresholds but not blocking CI"
        else
            success "✅ Coverage meets all thresholds"
        fi
    else
        log "📊 Coverage report generated (jq not available for threshold check)"
    fi
else
    warning "⚠️  Coverage summary not found"
fi

# Final success message
success "🎉 All critical evaluations passed! Deployment ready."

# Generate summary for PR comment (if in GitHub Actions)
if [ "${GITHUB_ACTIONS:-false}" = "true" ]; then
    log "📝 Generating PR summary..."
    cat > reports/pr-summary.md << EOF
## ✅ Evaluation Results

All critical tests passed! The build is ready for deployment.

### Test Results
- ✅ **Linting**: Passed
- ✅ **Contract Tests**: Passed  
- ✅ **Property Tests**: Passed
- ✅ **Config Tests**: Passed
- ✅ **Build**: Passed
- ✅ **Golden Master**: Passed

### Coverage
EOF

    if [ -f "coverage/coverage-summary.json" ] && command -v jq >/dev/null 2>&1; then
        LINES=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
        FUNCTIONS=$(jq -r '.total.functions.pct' coverage/coverage-summary.json)
        BRANCHES=$(jq -r '.total.branches.pct' coverage/coverage-summary.json)
        
        cat >> reports/pr-summary.md << EOF
- **Lines**: ${LINES}% (target: 85%)
- **Functions**: ${FUNCTIONS}% (target: 80%)  
- **Branches**: ${BRANCHES}% (target: 70%)
EOF
    else
        echo "- Coverage report available in artifacts" >> reports/pr-summary.md
    fi

    cat >> reports/pr-summary.md << EOF

🚀 **Status**: Ready to merge
EOF

    log "📄 PR summary written to reports/pr-summary.md"
fi

log "🎯 CI evaluation completed successfully!"
exit 0