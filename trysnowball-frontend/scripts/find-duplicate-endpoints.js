#!/usr/bin/env node

/**
 * Duplicate Endpoint Detection Script
 * 
 * Analyzes codebase to find:
 * - Duplicate API routes
 * - Multiple fetch calls to same endpoint
 * - Gateway/adapter function duplication
 * - Legacy vs canonical route usage
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Track all API usage across the codebase
const routeUsage = new Map();
const gatewayFunctions = new Map();
const duplicateRoutes = new Map();

// Patterns to detect
const PATTERNS = {
  fetch: /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
  axios: /axios\.(get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
  fetchWithAuth: /fetchWithAuth\s*\(\s*['"`]([^'"`]+)['"`]/g,
  fetchJSON: /fetchJSON\s*\(\s*['"`]([^'"`]+)['"`]/g,
  apiCall: /apiCall\s*\(\s*['"`]\w+['"`]\s*,\s*['"`]([^'"`]+)['"`]/g
};

console.log('🔍 TrySnowball Route Deduplication Analysis');
console.log('===========================================\n');

/**
 * Extract API routes from file content
 */
function extractRoutes(content, filePath) {
  const routes = [];
  
  Object.entries(PATTERNS).forEach(([type, pattern]) => {
    const matches = [...content.matchAll(pattern)];
    matches.forEach(match => {
      const route = type === 'axios' ? match[2] : match[1];
      
      // Only track API routes
      if (route && (route.startsWith('/api/') || route.startsWith('/auth/'))) {
        routes.push({
          route: route,
          type: type,
          file: filePath,
          line: content.substring(0, match.index).split('\n').length
        });
      }
    });
  });
  
  return routes;
}

/**
 * Detect gateway function definitions
 */
function extractGatewayFunctions(content, filePath) {
  const functions = [];
  
  // Look for gateway function exports
  const functionPatterns = [
    /export\s+(?:const|function)\s+(\w+)/g,
    /^\s*(?:const|function)\s+(\w+)\s*=/gm,
    /^\s*(\w+):\s*async?\s*\(/gm
  ];
  
  functionPatterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern)];
    matches.forEach(match => {
      const funcName = match[1];
      if (funcName && (
        funcName.includes('debt') || 
        funcName.includes('sync') || 
        funcName.includes('Gateway') ||
        funcName.includes('fetch') ||
        funcName.includes('get') ||
        funcName.includes('create') ||
        funcName.includes('update') ||
        funcName.includes('delete')
      )) {
        functions.push({
          name: funcName,
          file: filePath,
          line: content.substring(0, match.index).split('\n').length
        });
      }
    });
  });
  
  return functions;
}

/**
 * Analyze all source files
 */
function analyzeFiles() {
  const files = glob.sync('src/**/*.{js,ts,jsx,tsx}', {
    ignore: ['src/**/*.test.{js,ts,jsx,tsx}', 'src/**/*.d.ts']
  });
  
  console.log(`📁 Analyzing ${files.length} source files...\n`);
  
  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract API routes
      const routes = extractRoutes(content, filePath);
      routes.forEach(routeInfo => {
        const key = routeInfo.route;
        if (!routeUsage.has(key)) {
          routeUsage.set(key, []);
        }
        routeUsage.get(key).push(routeInfo);
      });
      
      // Extract gateway functions
      const functions = extractGatewayFunctions(content, filePath);
      functions.forEach(funcInfo => {
        const key = funcInfo.name;
        if (!gatewayFunctions.has(key)) {
          gatewayFunctions.set(key, []);
        }
        gatewayFunctions.get(key).push(funcInfo);
      });
      
    } catch (error) {
      console.warn(`⚠️  Could not read ${filePath}: ${error.message}`);
    }
  });
}

/**
 * Detect duplicate and conflicting routes
 */
function findDuplicates() {
  // Group similar routes
  const routeGroups = new Map();
  
  routeUsage.forEach((usages, route) => {
    // Normalize route for grouping (remove IDs, query params)
    const normalized = route
      .replace(/\/:\w+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
      .replace(/\?.*$/, '');
    
    if (!routeGroups.has(normalized)) {
      routeGroups.set(normalized, new Map());
    }
    routeGroups.get(normalized).set(route, usages);
  });
  
  // Find potential conflicts
  routeGroups.forEach((routes, normalized) => {
    if (routes.size > 1) {
      duplicateRoutes.set(normalized, routes);
    }
  });
}

/**
 * Print analysis results
 */
function printResults() {
  console.log('🔄 DUPLICATE ROUTE ANALYSIS');
  console.log('===========================\n');
  
  // Show routes used multiple times
  const multipleUsage = Array.from(routeUsage.entries())
    .filter(([route, usages]) => usages.length > 1);
  
  if (multipleUsage.length > 0) {
    console.log('📍 Routes Used in Multiple Places:\n');
    multipleUsage.forEach(([route, usages]) => {
      console.log(`🔗 ${route} (${usages.length} usages)`);
      usages.forEach(usage => {
        console.log(`   📄 ${usage.file}:${usage.line} (${usage.type})`);
      });
      console.log();
    });
  } else {
    console.log('✅ No duplicate route usage found!\n');
  }
  
  // Show conflicting route patterns
  if (duplicateRoutes.size > 0) {
    console.log('⚠️  CONFLICTING ROUTE PATTERNS:\n');
    duplicateRoutes.forEach((routes, pattern) => {
      console.log(`🔀 Pattern: ${pattern}`);
      routes.forEach((usages, route) => {
        console.log(`   🔗 ${route}`);
        usages.forEach(usage => {
          console.log(`      📄 ${usage.file}:${usage.line}`);
        });
      });
      console.log();
    });
  } else {
    console.log('✅ No conflicting route patterns found!\n');
  }
  
  // Show gateway functions
  console.log('🏗️  GATEWAY FUNCTIONS ANALYSIS');
  console.log('==============================\n');
  
  const suspiciousFunctions = Array.from(gatewayFunctions.entries())
    .filter(([name, locations]) => 
      locations.length > 1 || 
      name.includes('debt') || 
      name.includes('sync')
    );
  
  if (suspiciousFunctions.length > 0) {
    suspiciousFunctions.forEach(([name, locations]) => {
      console.log(`🔧 ${name}${locations.length > 1 ? ` (${locations.length} definitions)` : ''}`);
      locations.forEach(loc => {
        console.log(`   📄 ${loc.file}:${loc.line}`);
      });
      console.log();
    });
  } else {
    console.log('✅ No suspicious gateway functions found!\n');
  }
  
  // Summary
  console.log('📊 SUMMARY');
  console.log('==========');
  console.log(`Total API routes found: ${routeUsage.size}`);
  console.log(`Routes with multiple usage: ${multipleUsage.length}`);
  console.log(`Conflicting patterns: ${duplicateRoutes.size}`);
  console.log(`Gateway functions: ${gatewayFunctions.size}`);
  
  // Recommendations
  if (multipleUsage.length > 0 || duplicateRoutes.size > 0) {
    console.log('\n💡 RECOMMENDATIONS');
    console.log('==================');
    console.log('1. Create a canonical route registry');
    console.log('2. Consolidate duplicate gateways');
    console.log('3. Use consistent API patterns');
    console.log('4. Add linting rules to prevent duplicates');
  } else {
    console.log('\n🎉 EXCELLENT! No duplicates detected.');
  }
}

// Main execution
try {
  analyzeFiles();
  findDuplicates();
  printResults();
} catch (error) {
  console.error('❌ Analysis failed:', error.message);
  process.exit(1);
}