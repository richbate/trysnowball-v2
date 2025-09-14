#!/usr/bin/env node

/**
 * Comprehensive App Evaluation Runner
 * Executes all contracts, generators, and invariant checks offline
 * No manual UI testing required - hammers every function/feature programmatically
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EVALUATION_SUITES = [
  {
    name: 'Contracts Registry',
    command: 'npm run eval:contracts',
    description: 'Feature contracts and invariant checks',
    critical: true,
  },
  {
    name: 'Property-Based Tests', 
    command: 'npm run eval:property',
    description: 'Fuzzing math functions with fast-check',
    critical: true,
  },
  {
    name: 'Gateway Contracts',
    command: 'npm run eval:gateway', 
    description: 'API failure modes and circuit breakers',
    critical: true,
  },
  {
    name: 'Analytics Evaluation',
    command: 'npm run eval:analytics',
    description: 'Telemetry events and PII leak detection',
    critical: false, // Can continue if analytics broken
  },
  {
    name: 'Config & Flags',
    command: 'npm run eval:config',
    description: 'Environment configs and feature flag combinations',
    critical: true,
  },
  {
    name: 'Golden Master Snapshots',
    command: 'npm run eval:golden',
    description: 'Critical output consistency checks',
    critical: true,
  },
];

function logSection(title, color = '\x1b[36m') {
  console.log(`\n${color}═══ ${title} ═══\x1b[0m`);
}

function logSuccess(message) {
  console.log(`\x1b[32m✓ ${message}\x1b[0m`);
}

function logError(message) {
  console.log(`\x1b[31m✗ ${message}\x1b[0m`);
}

function logWarning(message) {
  console.log(`\x1b[33m⚠ ${message}\x1b[0m`);
}

function runCommand(command, description) {
  try {
    logSection(`Running: ${description}`);
    console.log(`Command: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    logSuccess(`${description} - PASSED`);
    return { success: true, output };
  } catch (error) {
    logError(`${description} - FAILED`);
    console.error(error.stdout || error.message);
    return { success: false, error: error.message, output: error.stdout };
  }
}

function generateReport(results) {
  const timestamp = new Date().toISOString();
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const critical_failures = results.filter(r => !r.success && r.critical).length;
  
  const report = {
    timestamp,
    summary: {
      total: results.length,
      passed,
      failed,
      critical_failures,
      success_rate: `${Math.round((passed / results.length) * 100)}%`,
    },
    results: results.map(r => ({
      suite: r.name,
      status: r.success ? 'PASS' : 'FAIL',
      critical: r.critical,
      description: r.description,
      error: r.error || null,
    })),
    recommendations: generateRecommendations(results),
  };

  // Write report to file
  const reportPath = path.join(__dirname, '..', 'evaluation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  return report;
}

function generateRecommendations(results) {
  const recommendations = [];
  
  const failedCritical = results.filter(r => !r.success && r.critical);
  const failedNonCritical = results.filter(r => !r.success && !r.critical);
  
  if (failedCritical.length > 0) {
    recommendations.push({
      level: 'CRITICAL',
      message: `${failedCritical.length} critical evaluation suite(s) failed. Deployment blocked.`,
      suites: failedCritical.map(r => r.name),
    });
  }
  
  if (failedNonCritical.length > 0) {
    recommendations.push({
      level: 'WARNING', 
      message: `${failedNonCritical.length} non-critical suite(s) failed. Consider fixing.`,
      suites: failedNonCritical.map(r => r.name),
    });
  }
  
  if (results.every(r => r.success)) {
    recommendations.push({
      level: 'SUCCESS',
      message: 'All evaluation suites passed! App is ready for deployment.',
      suites: [],
    });
  }
  
  return recommendations;
}

function displaySummary(report) {
  logSection('EVALUATION SUMMARY', '\x1b[35m');
  
  console.log(`📊 Results: ${report.summary.passed}/${report.summary.total} passed (${report.summary.success_rate})`);
  
  if (report.summary.critical_failures > 0) {
    logError(`🚨 ${report.summary.critical_failures} critical failure(s) detected`);
  }
  
  report.recommendations.forEach(rec => {
    switch(rec.level) {
      case 'CRITICAL':
        logError(`🛑 ${rec.message}`);
        break;
      case 'WARNING':
        logWarning(`⚠️  ${rec.message}`);
        break;
      case 'SUCCESS':
        logSuccess(`🎉 ${rec.message}`);
        break;
    }
    
    if (rec.suites.length > 0) {
      console.log(`   Affected suites: ${rec.suites.join(', ')}`);
    }
  });
  
  console.log(`\n📄 Full report saved to: evaluation-report.json`);
}

async function main() {
  const args = process.argv.slice(2);
  const isCI = args.includes('--ci') || process.env.CI === 'true';
  const quickMode = args.includes('--quick');
  
  logSection('🔍 TrySnowball App Evaluation', '\x1b[34m');
  console.log('Hammering every function/feature offline - no manual UI testing required');
  
  if (quickMode) {
    console.log('⚡ Quick mode: running critical suites only');
  }
  
  const suitesToRun = quickMode 
    ? EVALUATION_SUITES.filter(suite => suite.critical)
    : EVALUATION_SUITES;
  
  const results = [];
  let hasGlobalFailure = false;
  
  for (const suite of suitesToRun) {
    const result = runCommand(suite.command, suite.description);
    
    results.push({
      name: suite.name,
      description: suite.description,
      critical: suite.critical,
      success: result.success,
      error: result.error,
      output: result.output,
    });
    
    // Stop on critical failure in CI mode
    if (!result.success && suite.critical && isCI) {
      logError('Critical failure in CI mode - stopping evaluation');
      hasGlobalFailure = true;
      break;
    }
  }
  
  // Generate and display report
  const report = generateReport(results);
  displaySummary(report);
  
  // Exit with appropriate code
  const exitCode = (hasGlobalFailure || report.summary.critical_failures > 0) ? 1 : 0;
  
  if (exitCode === 0) {
    logSuccess('🎯 All critical evaluations passed!');
  } else {
    logError('💥 Evaluation failed - see report for details');
  }
  
  process.exit(exitCode);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception during evaluation: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logError(`Unhandled rejection during evaluation: ${error.message}`);
  process.exit(1);
});

main().catch((error) => {
  logError(`Evaluation runner failed: ${error.message}`);
  process.exit(1);
});