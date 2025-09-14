#!/usr/bin/env node

/**
 * AI Route CLI - Interactive Prompt Generator
 * 
 * Generates standardized AI prompts for route-based development.
 * Usage: node scripts/ai-route-cli.js [command] [routeKey]
 */

// Import RouteRegistry using ES modules approach
const path = require('path');

// Mock RouteRegistry for CLI usage since it's TypeScript
const RouteRegistry = {
  debts: {
    getAll: '/api/clean/debts',
    create: '/api/clean/debts',
    update: (id) => `/api/clean/debts/${id}`,
    delete: (id) => `/api/clean/debts/${id}`
  },
  auth: {
    me: '/auth/me',
    refresh: '/auth/refresh', 
    logout: '/auth/logout',
    requestLink: '/auth/request-link'
  },
  health: {
    main: '/health',
    auth: '/auth/health',
    api: '/api/health'
  },
  billing: {
    createSession: '/api/checkout/session',
    webhook: '/api/stripe/webhook'
  }
};

const RouteHelpers = {
  getRoute: (routeKey, ...params) => {
    const [domain, operation] = routeKey.split('.');
    const routeDomain = RouteRegistry[domain];
    
    if (!routeDomain) {
      throw new Error(`Domain "${domain}" not found in RouteRegistry`);
    }
    
    const routeFunction = routeDomain[operation];
    if (!routeFunction) {
      throw new Error(`Operation "${operation}" not found for domain "${domain}"`);
    }
    
    return typeof routeFunction === 'function' ? routeFunction(...params) : routeFunction;
  },
  
  getAllRoutePaths: () => {
    const paths = [];
    Object.keys(RouteRegistry).forEach(domain => {
      Object.keys(RouteRegistry[domain]).forEach(operation => {
        paths.push(`${domain}.${operation}`);
      });
    });
    return paths;
  },
  
  getAllRoutes: () => {
    const routes = [];
    Object.keys(RouteRegistry).forEach(domain => {
      Object.keys(RouteRegistry[domain]).forEach(operation => {
        const routeKey = `${domain}.${operation}`;
        try {
          const route = RouteHelpers.getRoute(routeKey, 'example-id');
          routes.push(route);
        } catch (error) {
          // Skip routes that require parameters we can't provide
        }
      });
    });
    return routes;
  }
};

const fs = require('fs');

// Color output for better CLI experience
const colors = {
  green: '\x1b[32m%s\x1b[0m',
  blue: '\x1b[34m%s\x1b[0m',
  yellow: '\x1b[33m%s\x1b[0m',
  red: '\x1b[31m%s\x1b[0m',
  cyan: '\x1b[36m%s\x1b[0m'
};

/**
 * CLI Commands
 */
const commands = {
  'list-routes': listRoutes,
  'generate-handler': generateHandlerPrompt,
  'generate-test': generateTestPrompt,
  'generate-gateway': generateGatewayPrompt,
  'generate-analytics': generateAnalyticsPrompt,
  'debug-route': generateDebugPrompt,
  'validate-route': validateRoute,
  'export-prompt': exportPromptFile
};

/**
 * Main CLI entry point
 */
function main() {
  const [,, command, routeKey, ...args] = process.argv;
  
  if (!command || command === 'help') {
    showHelp();
    return;
  }
  
  if (!commands[command]) {
    console.log(colors.red, `❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
  }
  
  try {
    commands[command](routeKey, ...args);
  } catch (error) {
    console.log(colors.red, `❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Show CLI help
 */
function showHelp() {
  console.log(colors.cyan, '🤖 AI Route CLI - TrySnowball Route Development Helper\\n');
  
  console.log('Available Commands:');
  console.log(colors.green, '  list-routes                    - List all available routes');
  console.log(colors.green, '  generate-handler <routeKey>    - Generate API handler prompt');
  console.log(colors.green, '  generate-test <routeKey>       - Generate test prompt');
  console.log(colors.green, '  generate-gateway <routeKey>    - Generate gateway integration prompt');
  console.log(colors.green, '  generate-analytics <routeKey>  - Generate analytics tracking prompt');
  console.log(colors.green, '  debug-route <routeKey>         - Generate debug prompt');
  console.log(colors.green, '  validate-route <routeKey>      - Validate route exists');
  console.log(colors.green, '  export-prompt <routeKey>       - Export prompt to file');
  
  console.log('\\nExamples:');
  console.log(colors.blue, '  node scripts/ai-route-cli.js list-routes');
  console.log(colors.blue, '  node scripts/ai-route-cli.js generate-handler debts.create');
  console.log(colors.blue, '  node scripts/ai-route-cli.js generate-test auth.me');
  console.log(colors.blue, '  node scripts/ai-route-cli.js debug-route billing.createSession');
}

/**
 * List all available routes
 */
function listRoutes() {
  console.log(colors.cyan, '📋 Available Routes in RouteRegistry:\\n');
  
  try {
    const allRoutePaths = RouteHelpers.getAllRoutePaths();
    
    const routesByDomain = {};
    allRoutePaths.forEach(routePath => {
      const [domain] = routePath.split('.');
      if (!routesByDomain[domain]) {
        routesByDomain[domain] = [];
      }
      routesByDomain[domain].push(routePath);
    });
    
    Object.entries(routesByDomain).forEach(([domain, routes]) => {
      console.log(colors.yellow, `${domain.toUpperCase()}:`);
      routes.forEach(route => {
        try {
          const url = RouteHelpers.getRoute(route, 'example-id');
          const method = getHTTPMethod(route);
          console.log(`  ${route.padEnd(20)} ${method.padEnd(6)} ${url}`);
        } catch (error) {
          console.log(`  ${route.padEnd(20)} ERROR  Failed to generate URL`);
        }
      });
      console.log('');
    });
    
    console.log(colors.green, `Total Routes: ${allRoutePaths.length}`);
  } catch (error) {
    console.log(colors.red, `Error loading routes: ${error.message}`);
  }
}

/**
 * Generate API handler prompt
 */
function generateHandlerPrompt(routeKey) {
  if (!routeKey) {
    console.log(colors.red, '❌ Route key required');
    return;
  }
  
  validateRouteExists(routeKey);
  
  const url = RouteHelpers.getRoute(routeKey, ':id');
  const method = getHTTPMethod(routeKey);
  const [domain] = routeKey.split('.');
  
  const prompt = `
Context: TrySnowball uses canonical RouteRegistry for all API endpoints.

Task: Generate a Cloudflare Worker handler for route "${routeKey}"

Route Details:
- Route Key: ${routeKey}
- URL Pattern: ${url}
- HTTP Method: ${method}
- Domain: ${domain}

Requirements:
1. Use D1 database for persistence
2. Include JWT authentication validation
3. Follow existing error handling patterns
4. Add PostHog telemetry tracking
5. Return JSON responses with proper HTTP status codes

Database Schema:
${getDatabaseSchema(domain)}

Authentication:
- JWT token in Authorization header
- Validate using auth-magic.js patterns

Response Format:
${getResponseFormat(routeKey)}

Please generate the complete handler function.
`;

  console.log(colors.cyan, '🔧 Generated API Handler Prompt:\\n');
  console.log(prompt);
}

/**
 * Generate test prompt
 */
function generateTestPrompt(routeKey) {
  if (!routeKey) {
    console.log(colors.red, '❌ Route key required');
    return;
  }
  
  validateRouteExists(routeKey);
  
  const url = RouteHelpers.getRoute(routeKey, 'test-id');
  const gatewayFunction = getGatewayFunction(routeKey);
  
  const prompt = `
Context: TrySnowball uses RouteRegistry for canonical endpoint management.

Task: Generate Jest tests for route "${routeKey}"

Route Details:
- Route Key: ${routeKey}
- URL Pattern: ${url}
- Gateway Function: ${gatewayFunction}

Test Requirements:
1. Test successful API calls
2. Test error handling (401, 404, 500)
3. Test request/response validation
4. Test PostHog analytics tracking
5. Mock external dependencies

Mock Pattern:
\`\`\`typescript
jest.mock('../utils/routeAnalytics', () => ({
  RouteAnalytics: {
    apiCallStarted: jest.fn(),
    apiCallSuccess: jest.fn(),
    apiCallError: jest.fn(),
    debtOperation: jest.fn()
  }
}));
\`\`\`

Please generate comprehensive test cases.
`;

  console.log(colors.cyan, '🧪 Generated Test Prompt:\\n');
  console.log(prompt);
}

/**
 * Generate gateway integration prompt
 */
function generateGatewayPrompt(routeKey) {
  if (!routeKey) {
    console.log(colors.red, '❌ Route key required');
    return;
  }
  
  validateRouteExists(routeKey);
  
  const method = getHTTPMethod(routeKey);
  const operation = getOperationName(routeKey);
  const functionName = getGatewayFunction(routeKey);
  
  const prompt = `
Context: TrySnowball uses unifiedDebtsGateway.ts as the single source for API calls.

Task: Add new endpoint to unified gateway

Route Details:
- Route Key: ${routeKey}
- Operation: ${operation}
- Function Name: ${functionName}
- HTTP Method: ${method}

Integration Requirements:
1. Use RouteHelpers.getRoute() for URL generation
2. Include PostHog analytics tracking
3. Follow existing error handling patterns
4. Add TypeScript types for request/response
5. Include JSDoc documentation

Existing Pattern:
\`\`\`typescript
/**
 * ${operation} operation
 */
export async function ${functionName}(${getParameterSignature(routeKey)}): Promise<${getReturnType(routeKey)}> {
  console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UNIFIED_GATEWAY] ${operation}:', ${getIdentifier(routeKey)});
  
  const response = await fetchWithAuth(RouteHelpers.getRoute('${routeKey}'${getRouteParams(routeKey)}), {
    method: '${method}'${getRequestBody(routeKey)}
  });

  const data = await response.json();
  console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UNIFIED_GATEWAY] ✅ ${operation} complete');
  
  // Track operation
  RouteAnalytics.${getTrackingMethod(routeKey)}('${getOperationType(routeKey)}'${getTrackingParams(routeKey)});
  
  return data${getResponseKey(routeKey)};
}
\`\`\`

Please generate the complete gateway function.
`;

  console.log(colors.cyan, '🚀 Generated Gateway Integration Prompt:\\n');
  console.log(prompt);
}

/**
 * Generate analytics prompt
 */
function generateAnalyticsPrompt(routeKey) {
  if (!routeKey) {
    console.log(colors.red, '❌ Route key required');
    return;
  }
  
  validateRouteExists(routeKey);
  
  const actionName = getOperationName(routeKey);
  const [domain] = routeKey.split('.');
  
  const prompt = `
Context: TrySnowball tracks all API operations through PostHog with standardized schemas.

Task: Add analytics tracking for route "${routeKey}"

Route Context:
- Related Route: ${routeKey}
- Domain: ${domain}
- Operation: ${actionName}

Analytics Requirements:
1. Use RouteAnalytics.userAction() for user interactions
2. Use RouteAnalytics.debtOperation() for debt CRUD operations
3. Include relevant metadata (debt_id, operation, etc.)
4. Follow event naming conventions

Example Implementation:
\`\`\`typescript
// Track user action
RouteAnalytics.userAction('${actionName}', '${routeKey}', {
  ${getMetadataFields(routeKey)}
});

// Or for debt operations
RouteAnalytics.debtOperation('${getOperationType(routeKey)}', debtId);

// For API call tracking (automatic in fetchWithAuth):
RouteAnalytics.apiCallStarted('${routeKey}', '${getHTTPMethod(routeKey)}');
RouteAnalytics.apiCallSuccess('${routeKey}', '${getHTTPMethod(routeKey)}', responseTime);
\`\`\`

Please generate the analytics tracking code.
`;

  console.log(colors.cyan, '📈 Generated Analytics Prompt:\\n');
  console.log(prompt);
}

/**
 * Generate debug prompt
 */
function generateDebugPrompt(routeKey, issue = 'Route not working correctly') {
  if (!routeKey) {
    console.log(colors.red, '❌ Route key required');
    return;
  }
  
  validateRouteExists(routeKey);
  
  const expectedUrl = RouteHelpers.getRoute(routeKey, 'example-id');
  
  const prompt = `
Context: TrySnowball uses RouteRegistry to prevent endpoint chaos and route forks.

Issue: ${issue}

Debugging Information:
- Route Key: ${routeKey}
- Expected URL: ${expectedUrl}
- Expected Method: ${getHTTPMethod(routeKey)}
- Gateway Function: ${getGatewayFunction(routeKey)}

Common Issues:
1. Route not found in RouteRegistry
2. Worker handler missing for route
3. Parameter mismatch in URL generation
4. Authentication token issues
5. PostHog tracking errors

Debug Steps:
1. Check RouteRegistry has the route ✓
2. Verify worker-routes.json includes handler
3. Test route generation with RouteHelpers.getRoute()
4. Check JWT token validity
5. Review PostHog analytics for error patterns

Validation Commands:
\`\`\`bash
node scripts/ai-route-cli.js validate-route ${routeKey}
npm run test:routes
grep -r "${expectedUrl}" cloudflare-workers/
\`\`\`

Please analyze the issue and suggest fixes.
`;

  console.log(colors.cyan, '🐛 Generated Debug Prompt:\\n');
  console.log(prompt);
}

/**
 * Validate route exists
 */
function validateRoute(routeKey) {
  if (!routeKey) {
    console.log(colors.red, '❌ Route key required');
    return;
  }
  
  console.log(colors.cyan, `🔍 Validating route: ${routeKey}\\n`);
  
  try {
    // Check if route exists in registry
    const url = RouteHelpers.getRoute(routeKey, 'test-id');
    console.log(colors.green, `✓ Route exists in RouteRegistry`);
    console.log(`  URL: ${url}`);
    console.log(`  Method: ${getHTTPMethod(routeKey)}`);
    
    // Check if worker handler exists
    const workerRoutes = loadWorkerRoutes();
    const hasHandler = checkWorkerHandler(routeKey, workerRoutes);
    
    if (hasHandler) {
      console.log(colors.green, `✓ Worker handler found`);
    } else {
      console.log(colors.yellow, `⚠ Worker handler not found in worker-routes.json`);
    }
    
    // Check if gateway function exists
    const gatewayExists = checkGatewayExists(routeKey);
    if (gatewayExists) {
      console.log(colors.green, `✓ Gateway function exists`);
    } else {
      console.log(colors.yellow, `⚠ Gateway function may not exist`);
    }
    
    console.log(colors.green, '\\n✅ Route validation complete');
    
  } catch (error) {
    console.log(colors.red, `❌ Route validation failed: ${error.message}`);
  }
}

/**
 * Export prompt to file
 */
function exportPromptFile(routeKey, promptType = 'handler') {
  if (!routeKey) {
    console.log(colors.red, '❌ Route key required');
    return;
  }
  
  let prompt = '';
  
  switch (promptType) {
    case 'handler':
      generateHandlerPrompt(routeKey);
      return; // Already outputs
    case 'test':
      generateTestPrompt(routeKey);
      return;
    case 'gateway':
      generateGatewayPrompt(routeKey);
      return;
    default:
      console.log(colors.red, `❌ Unknown prompt type: ${promptType}`);
      return;
  }
}

// Helper functions
function validateRouteExists(routeKey) {
  try {
    RouteHelpers.getRoute(routeKey, 'test');
  } catch (error) {
    throw new Error(`Route "${routeKey}" not found in RouteRegistry`);
  }
}

function getHTTPMethod(routeKey) {
  if (routeKey.includes('.create') || routeKey.includes('.requestLink')) return 'POST';
  if (routeKey.includes('.update')) return 'PUT';
  if (routeKey.includes('.delete')) return 'DELETE';
  return 'GET';
}

function getOperationName(routeKey) {
  const [, operation] = routeKey.split('.');
  const operationMap = {
    getAll: 'Fetching all',
    create: 'Creating',
    update: 'Updating', 
    delete: 'Deleting',
    me: 'Getting current user',
    refresh: 'Refreshing token',
    requestLink: 'Requesting magic link'
  };
  return operationMap[operation] || operation;
}

function getGatewayFunction(routeKey) {
  const [domain, operation] = routeKey.split('.');
  const functionMap = {
    'debts.getAll': 'fetchAllDebts',
    'debts.create': 'createDebt',
    'debts.update': 'updateDebt',
    'debts.delete': 'deleteDebt',
    'auth.me': 'getCurrentUser',
    'auth.refresh': 'refreshToken',
    'auth.requestLink': 'requestMagicLink'
  };
  return functionMap[routeKey] || `${operation}${domain.charAt(0).toUpperCase() + domain.slice(1)}`;
}

function getDatabaseSchema(domain) {
  const schemas = {
    debts: 'debts table: id, user_id, name, amount_cents, min_payment_cents, apr_bps, debt_type',
    auth: 'users table: id, email, created_at, plan, is_pro',
    billing: 'billing_subscriptions table: user_id, stripe_customer_id, plan, status',
    settings: 'user_settings table: user_id, preferences_json'
  };
  return schemas[domain] || 'Refer to migration files in migrations/ directory';
}

function getResponseFormat(routeKey) {
  if (routeKey.includes('debts.getAll')) return '{ debts: UKDebt[] }';
  if (routeKey.includes('debts.create')) return '{ debt: UKDebt }';
  if (routeKey.includes('auth.me')) return '{ user: User }';
  return '{ success: boolean }';
}

function getParameterSignature(routeKey) {
  if (routeKey.includes('create')) return 'data: CreateRequest';
  if (routeKey.includes('update')) return 'id: string, updates: UpdateRequest';
  if (routeKey.includes('delete')) return 'id: string';
  return '';
}

function getReturnType(routeKey) {
  if (routeKey.includes('getAll')) return 'Array<ResponseType>';
  if (routeKey.includes('create')) return 'ResponseType';
  if (routeKey.includes('update') || routeKey.includes('delete')) return 'void';
  return 'ResponseType';
}

function getIdentifier(routeKey) {
  if (routeKey.includes('create')) return 'data.name || data.id';
  if (routeKey.includes('update') || routeKey.includes('delete')) return 'id';
  return '""';
}

function getRouteParams(routeKey) {
  if (routeKey.includes('update') || routeKey.includes('delete')) return ', id';
  return '';
}

function getRequestBody(routeKey) {
  if (routeKey.includes('create')) return ',\\n    body: JSON.stringify(data)';
  if (routeKey.includes('update')) return ',\\n    body: JSON.stringify(updates)';
  return '';
}

function getTrackingMethod(routeKey) {
  if (routeKey.includes('debts.')) return 'debtOperation';
  if (routeKey.includes('auth.')) return 'authEvent';
  return 'userAction';
}

function getOperationType(routeKey) {
  if (routeKey.includes('.getAll')) return 'viewed';
  if (routeKey.includes('.create')) return 'created';
  if (routeKey.includes('.update')) return 'updated';
  if (routeKey.includes('.delete')) return 'deleted';
  return 'action_taken';
}

function getTrackingParams(routeKey) {
  if (routeKey.includes('debts.') && !routeKey.includes('getAll')) return ', id';
  return '';
}

function getResponseKey(routeKey) {
  if (routeKey.includes('getAll')) return '.items || .debts || .data';
  if (routeKey.includes('create')) return '.item || .debt || .data';
  return '';
}

function getMetadataFields(routeKey) {
  if (routeKey.includes('debts.')) return 'debt_id: debtId, operation: "crud"';
  if (routeKey.includes('auth.')) return 'auth_method: "magic_link"';
  return 'domain: "' + routeKey.split('.')[0] + '"';
}

function loadWorkerRoutes() {
  try {
    const workerRoutesPath = path.join(process.cwd(), 'cloudflare-workers', 'worker-routes.json');
    const data = fs.readFileSync(workerRoutesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

function checkWorkerHandler(routeKey, workerRoutes) {
  const expectedUrl = RouteHelpers.getRoute(routeKey, ':id').replace(/:[^/]+/g, ':id');
  const method = getHTTPMethod(routeKey);
  
  return Object.values(workerRoutes).some(worker => 
    worker.routes && worker.routes.some(route => 
      (route.path === expectedUrl || route.path === expectedUrl.replace(':id', '')) &&
      route.method.toUpperCase() === method.toUpperCase()
    )
  );
}

function checkGatewayExists(routeKey) {
  try {
    const gatewayPath = path.join(process.cwd(), 'src', 'data', 'unifiedDebtsGateway.ts');
    const content = fs.readFileSync(gatewayPath, 'utf8');
    const functionName = getGatewayFunction(routeKey);
    return content.includes(`export async function ${functionName}`);
  } catch (error) {
    return false;
  }
}

// Run CLI
if (require.main === module) {
  main();
}

module.exports = {
  commands,
  getHTTPMethod,
  getGatewayFunction
};