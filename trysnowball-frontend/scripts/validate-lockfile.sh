#!/bin/bash
# Validate lockfile integrity and prevent dependency drift

set -e

echo "🔒 Validating package-lock.json integrity..."

# Check if package-lock.json exists
if [ ! -f package-lock.json ]; then
    echo "❌ package-lock.json missing - run 'npm install' to generate"
    exit 1
fi

# Check if lockfile is in sync with package.json
if ! npm ci --dry-run > /dev/null 2>&1; then
    echo "❌ package-lock.json out of sync with package.json"
    echo "💡 Run 'npm install' to update lockfile"
    exit 1
fi

# Check for known vulnerable packages with fixed versions
echo "🔍 Checking for known security issues..."
if ! npm run audit:critical > /dev/null 2>&1; then
    echo "❌ Critical vulnerabilities found in locked dependencies"
    echo "💡 Review 'npm audit' output and update vulnerable packages"
    exit 1
fi

# Verify Node.js version alignment
if [ -f .nvmrc ]; then
    NODE_VERSION=$(cat .nvmrc)
    CURRENT_NODE=$(node --version | sed 's/v//')
    if [[ ! "$CURRENT_NODE" == "$NODE_VERSION"* ]]; then
        echo "⚠️  Node.js version mismatch:"
        echo "   Expected: $NODE_VERSION (from .nvmrc)"
        echo "   Current:  $CURRENT_NODE"
        echo "💡 Run 'nvm use' to switch to the correct version"
    fi
fi

echo "✅ Lockfile validation passed - dependencies are secure and locked"