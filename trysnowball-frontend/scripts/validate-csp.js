#!/usr/bin/env node

/**
 * CSP Validation Script
 * 
 * This script validates that Content Security Policy headers maintain
 * compatibility with Google Analytics and other critical business functions.
 * 
 * Usage: node scripts/validate-csp.js
 */

const fs = require('fs');
const path = require('path');

// Critical domains that MUST be allowed for analytics to work
const CRITICAL_ANALYTICS_DOMAINS = [
  'www.googletagmanager.com',
  'www.google-analytics.com',
  '*.google-analytics.com', // For regional domains
  'analytics.google.com'
];

// Required CSP directives for analytics
const REQUIRED_CSP_DIRECTIVES = {
  'script-src': ['https://www.googletagmanager.com'],
  'connect-src': [
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://*.google-analytics.com'
  ]
};

/**
 * Parse CSP string into structured object
 */
function parseCSP(cspString) {
  const directives = {};
  
  cspString.split(';').forEach(directive => {
    const trimmed = directive.trim();
    if (!trimmed) return;
    
    const [name, ...values] = trimmed.split(/\s+/);
    directives[name] = values;
  });
  
  return directives;
}

/**
 * Check if a domain is allowed by CSP directive
 */
function isDomainAllowed(domain, allowedSources) {
  if (!allowedSources) return false;
  
  return allowedSources.some(source => {
    // Handle wildcard domains
    if (source.includes('*')) {
      const pattern = source.replace(/\*/g, '.*');
      return new RegExp(pattern).test(domain);
    }
    
    // Handle exact matches
    return source === domain || source === `https://${domain}`;
  });
}

/**
 * Validate CSP headers from _headers file
 */
function validateHeadersFile() {
  const headersPath = path.join(__dirname, '../public/_headers');
  
  if (!fs.existsSync(headersPath)) {
    console.error('❌ _headers file not found at:', headersPath);
    return false;
  }
  
  const headersContent = fs.readFileSync(headersPath, 'utf8');
  const cspMatch = headersContent.match(/Content-Security-Policy:\s*(.+)/);
  
  if (!cspMatch) {
    console.error('❌ No Content-Security-Policy found in _headers file');
    return false;
  }
  
  const cspString = cspMatch[1].trim();
  console.log('🔍 Found CSP:', cspString);
  
  return validateCSP(cspString);
}

/**
 * Validate CSP headers from index.html
 */
function validateIndexHTML() {
  const indexPath = path.join(__dirname, '../public/index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found at:', indexPath);
    return false;
  }
  
  const htmlContent = fs.readFileSync(indexPath, 'utf8');
  const cspMatch = htmlContent.match(/Content-Security-Policy"\s+content="([^"]+)"/);
  
  if (!cspMatch) {
    console.log('ℹ️ No Content-Security-Policy meta tag found in index.html');
    return true; // This is optional
  }
  
  const cspString = cspMatch[1];
  console.log('🔍 Found CSP in HTML:', cspString);
  
  return validateCSP(cspString);
}

/**
 * Validate a CSP string
 */
function validateCSP(cspString) {
  const directives = parseCSP(cspString);
  let isValid = true;
  
  console.log('\n📋 Validating CSP directives...');
  
  // Check required directives
  Object.entries(REQUIRED_CSP_DIRECTIVES).forEach(([directive, requiredDomains]) => {
    console.log(`\n🔍 Checking ${directive}:`);
    
    if (!directives[directive]) {
      console.error(`❌ Missing required directive: ${directive}`);
      isValid = false;
      return;
    }
    
    const allowedSources = directives[directive];
    console.log(`   Current sources: ${allowedSources.join(', ')}`);
    
    requiredDomains.forEach(domain => {
      if (!isDomainAllowed(domain, allowedSources)) {
        console.error(`❌ Required domain not allowed: ${domain}`);
        isValid = false;
      } else {
        console.log(`✅ ${domain} is allowed`);
      }
    });
  });
  
  // Check for Google Analytics script tag compatibility
  console.log('\n🔍 Checking Google Analytics compatibility:');
  
  const scriptSrc = directives['script-src'];
  if (!scriptSrc || !isDomainAllowed('www.googletagmanager.com', scriptSrc)) {
    console.error('❌ Google Analytics script loading will be blocked');
    isValid = false;
  } else {
    console.log('✅ Google Analytics script loading is allowed');
  }
  
  // Check Analytics tracking ID
  const indexPath = path.join(__dirname, '../public/index.html');
  if (fs.existsSync(indexPath)) {
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    if (htmlContent.includes('G-5QLHMSPPZ6')) {
      console.log('✅ Google Analytics tracking ID found');
    } else {
      console.error('❌ Google Analytics tracking ID not found');
      isValid = false;
    }
  }
  
  return isValid;
}

/**
 * Main validation function
 */
function main() {
  console.log('🔐 CSP Analytics Protection Validator');
  console.log('=====================================\n');
  
  let allValid = true;
  
  // Validate _headers file (primary CSP source)
  console.log('📁 Validating _headers file...');
  const headersValid = validateHeadersFile();
  
  // Validate index.html (backup CSP source)
  console.log('\n📄 Validating index.html...');
  const htmlValid = validateIndexHTML();
  
  allValid = headersValid && htmlValid;
  
  console.log('\n' + '='.repeat(50));
  
  if (allValid) {
    console.log('✅ All CSP validations passed!');
    console.log('🎯 Google Analytics is properly configured');
    process.exit(0);
  } else {
    console.log('❌ CSP validation failed!');
    console.log('⚠️  Analytics may be blocked - this is CRITICAL for business');
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  main();
}

module.exports = { validateCSP, parseCSP, isDomainAllowed };