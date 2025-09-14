#!/usr/bin/env node

/**
 * Pre-commit Hook: Route Usage Validation
 * 
 * Validates that all API routes use RouteRegistry before allowing commit.
 * Provides instant feedback to developers about route violations.
 * 
 * Usage:
 * - As pre-commit hook: Runs automatically on git commit
 * - Standalone: node scripts/checkRouteUsage.js
 * - In CI: npm run check:routes
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

console.log(colorize('🔍 Route Usage Validation', 'cyan'));
console.log(colorize('=========================', 'cyan'));
console.log();

// Configuration
const ALLOWED_HARDCODED_ROUTES = new Set([
  // Legacy routes being phased out (with warnings)
  '/api/debts',
  '/api/user_settings',
  
  // Health endpoints (OK to hardcode)
  '/health',
  '/auth/health',
  '/api/health',
  
  // Example/documentation routes
  'https://example.com/api'
]);

const ROUTE_PATTERNS = [
  /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /axios\.(get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /fetchWithAuth\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /fetchJSON\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /apiCall\s*\(\s*['"`]\w+['"`]\s*,\s*['"`]([^'"`]+)['"`]/g
];

/**
 * Get files to check (either staged files or all source files)
 */
function getFilesToCheck() {
  try {
    // Try to get staged files (for pre-commit hook)
    const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
      .split('\n')
      .filter(file => 
        file.length > 0 && 
        file.match(/^src\/.*\.(ts|tsx|js|jsx)$/) &&
        !file.includes('.test.') &&
        !file.includes('.d.ts')
      );
    
    if (stagedFiles.length > 0) {
      console.log(colorize(`📋 Checking ${stagedFiles.length} staged files for route violations...`, 'blue'));
      return stagedFiles;
    }
  } catch (error) {
    // Not in git context or no staged files
  }
  
  // Fallback to all source files
  const allFiles = glob.sync('src/**/*.{ts,tsx,js,jsx}', {
    ignore: [
      'src/**/*.test.{ts,tsx,js,jsx}',
      'src/**/*.d.ts',
      'src/routes/**' // Exclude route registry itself
    ]
  });
  
  console.log(colorize(`📋 Checking ${allFiles.length} source files for route violations...`, 'blue'));
  return allFiles;
}

/**
 * Extract API routes from file content
 */
function extractRoutes(content, filePath) {
  const routes = [];
  
  ROUTE_PATTERNS.forEach((pattern, index) => {
    const matches = [...content.matchAll(pattern)];
    matches.forEach(match => {
      const route = index === 1 ? match[2] : match[1]; // axios pattern uses match[2]
      
      if (route && (route.startsWith('/api/') || route.startsWith('/auth/'))) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        routes.push({
          route,
          line: lineNumber,
          match: match[0],
          file: filePath
        });
      }
    });
  });
  
  return routes;
}

/**
 * Validate routes in files
 */
function validateRoutes() {
  const files = getFilesToCheck();
  const violations = [];
  const warnings = [];
  let totalRoutes = 0;

  files.forEach(filePath => {
    try {
      const fullPath = path.resolve(filePath);
      if (!fs.existsSync(fullPath)) return;
      
      const content = fs.readFileSync(fullPath, 'utf8');
      const routes = extractRoutes(content, filePath);
      
      if (routes.length === 0) return;
      
      totalRoutes += routes.length;
      
      // Check if file imports RouteRegistry
      const usesRouteRegistry = content.includes('RouteRegistry') || 
                              content.includes('RouteHelpers') ||
                              content.includes('getRoute(');

      routes.forEach(routeInfo => {
        const { route, line, match, file } = routeInfo;
        
        if (ALLOWED_HARDCODED_ROUTES.has(route)) {
          // Allowed but warn about legacy routes
          if (route.startsWith('/api/debts') || route.startsWith('/api/user')) {
            warnings.push({
              file,
              line,
              route,
              message: 'Legacy route - consider migrating to RouteRegistry',
              severity: 'warning'
            });
          }
        } else if (!usesRouteRegistry) {
          // File has API routes but doesn't use RouteRegistry
          violations.push({
            file,
            line,
            route,
            match,
            message: 'Hardcoded API route detected. Use RouteRegistry instead.',
            severity: 'error'
          });
        }
      });
      
    } catch (error) {
      console.warn(colorize(`⚠️  Could not check ${filePath}: ${error.message}`, 'yellow'));
    }
  });
  
  return { violations, warnings, totalRoutes };
}

/**
 * Display validation results
 */
function displayResults(violations, warnings, totalRoutes) {
  console.log();
  
  if (violations.length === 0 && warnings.length === 0) {
    console.log(colorize('✅ All routes are properly managed!', 'green'));
    console.log(colorize(`   Checked ${totalRoutes} API calls across ${getFilesToCheck().length} files`, 'green'));
    console.log();
    return true;
  }
  
  // Show violations (blocking)
  if (violations.length > 0) {
    console.log(colorize('❌ ROUTE VIOLATIONS DETECTED', 'red'));
    console.log(colorize('============================', 'red'));
    console.log();
    
    violations.forEach((violation, index) => {
      console.log(colorize(`${index + 1}. ${violation.file}:${violation.line}`, 'red'));
      console.log(colorize(`   Route: ${violation.route}`, 'red'));
      console.log(colorize(`   Issue: ${violation.message}`, 'red'));
      console.log();
      console.log(colorize('   Fix:', 'yellow'));
      console.log(colorize(`   import { RouteHelpers } from '../routes/routeRegistry';`, 'cyan'));
      console.log(colorize(`   fetch(RouteHelpers.getRoute('debts.getAll'))`, 'cyan'));
      console.log();
    });
  }
  
  // Show warnings (non-blocking)  
  if (warnings.length > 0) {
    console.log(colorize('⚠️  ROUTE WARNINGS', 'yellow'));
    console.log(colorize('=================', 'yellow'));
    console.log();
    
    warnings.forEach((warning, index) => {
      console.log(colorize(`${index + 1}. ${warning.file}:${warning.line}`, 'yellow'));
      console.log(colorize(`   Route: ${warning.route}`, 'yellow')); 
      console.log(colorize(`   Issue: ${warning.message}`, 'yellow'));
      console.log();
    });
  }
  
  // Summary
  console.log(colorize('📊 SUMMARY', 'bold'));
  console.log(colorize('============', 'bold'));
  console.log(`Total API calls checked: ${totalRoutes}`);
  console.log(`${colorize('Violations (blocking):', 'red')} ${violations.length}`);
  console.log(`${colorize('Warnings (legacy):', 'yellow')} ${warnings.length}`);
  console.log();
  
  if (violations.length > 0) {
    console.log(colorize('💡 QUICK FIX GUIDE:', 'cyan'));
    console.log(colorize('1. Import RouteRegistry in files with violations', 'cyan'));
    console.log(colorize('2. Replace hardcoded strings with RouteHelpers.getRoute()', 'cyan'));
    console.log(colorize('3. Available routes: debts.create, auth.me, settings.get, etc.', 'cyan'));
    console.log(colorize('4. See docs/API_CONTRACT.md for complete reference', 'cyan'));
    console.log();
    return false;
  }
  
  return true; // Only warnings, allow commit
}

/**
 * Main execution
 */
function main() {
  const { violations, warnings, totalRoutes } = validateRoutes();
  const success = displayResults(violations, warnings, totalRoutes);
  
  if (success) {
    console.log(colorize('🎉 Route validation passed!', 'green'));
    process.exit(0);
  } else {
    console.log(colorize('❌ Route validation failed. Fix violations before committing.', 'red'));
    process.exit(1);
  }
}

// Handle both direct execution and module import
if (require.main === module) {
  main();
}

module.exports = { validateRoutes, extractRoutes };