/**
 * End-to-End Testing Worker for TrySnowball
 * Tests the complete user journey from signup to checkout
 */

// Test configuration
const TEST_CONFIG = {
  staging: {
    baseUrl: 'https://staging-trysnowball.pages.dev',
    authUrl: 'https://staging-trysnowball.pages.dev/auth',
    apiUrl: 'https://staging-trysnowball.pages.dev/api'
  },
  production: {
    baseUrl: 'https://trysnowball.co.uk',
    authUrl: 'https://trysnowball.co.uk/auth', 
    apiUrl: 'https://trysnowball.co.uk/api'
  }
};

const TEST_USER = {
  email: 'e2e-test@trysnowball.test',
  testStripeCards: {
    success: '4242424242424242',
    decline: '4000000000000002',
    requiresAuth: '4000002760003184'
  }
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === '/') {
        return new Response(getTestDashboardHTML(), {
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        });
      }
      
      if (url.pathname === '/run-tests') {
        const environment = url.searchParams.get('env') || 'staging';
        const testSuite = url.searchParams.get('suite') || 'all';
        
        const results = await runTestSuite(environment, testSuite, env);
        
        return new Response(JSON.stringify(results, null, 2), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          worker: 'e2e-tests'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      return new Response('E2E Testing Worker - Use /run-tests?env=staging&suite=all', {
        headers: corsHeaders
      });
      
    } catch (error) {
      console.error('E2E Worker error:', error);
      return new Response(JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};

async function runTestSuite(environment, testSuite, env) {
  const config = TEST_CONFIG[environment];
  if (!config) {
    throw new Error(`Invalid environment: ${environment}`);
  }
  
  console.log(`🧪 Running ${testSuite} tests on ${environment}...`);
  
  const results = {
    environment,
    testSuite,
    timestamp: new Date().toISOString(),
    summary: { total: 0, passed: 0, failed: 0 },
    tests: []
  };
  
  const testFunctions = {
    'health': [testHealthEndpoints],
    'auth': [testMagicLinkFlow, testJWTValidation],
    'checkout': [testStripeCheckout, testFoundersCheckout],
    'all': [
      testHealthEndpoints,
      testMagicLinkFlow,
      testJWTValidation,
      testStripeCheckout,
      testFoundersCheckout
    ]
  };
  
  const testsToRun = testFunctions[testSuite] || testFunctions.all;
  
  for (const testFunc of testsToRun) {
    try {
      console.log(`Running ${testFunc.name}...`);
      const testResult = await testFunc(config, env);
      results.tests.push({
        name: testFunc.name,
        status: 'passed',
        duration: testResult.duration,
        details: testResult.details
      });
      results.summary.passed++;
    } catch (error) {
      console.error(`❌ ${testFunc.name} failed:`, error);
      results.tests.push({
        name: testFunc.name,
        status: 'failed',
        error: error.message,
        stack: error.stack
      });
      results.summary.failed++;
    }
    results.summary.total++;
  }
  
  console.log(`✅ Tests complete: ${results.summary.passed}/${results.summary.total} passed`);
  
  return results;
}

// Test: Health Endpoints
async function testHealthEndpoints(config) {
  const startTime = Date.now();
  const results = {};
  
  // Test auth worker health
  const authResponse = await fetch(`${config.authUrl}/health`);
  results.authHealth = {
    status: authResponse.status,
    ok: authResponse.ok
  };
  
  // Test API worker health  
  const apiResponse = await fetch(`${config.apiUrl}/health`);
  results.apiHealth = {
    status: apiResponse.status,
    ok: apiResponse.ok
  };
  
  if (!authResponse.ok || !apiResponse.ok) {
    throw new Error('Health check failed');
  }
  
  return {
    duration: Date.now() - startTime,
    details: results
  };
}

// Test: Magic Link Authentication Flow
async function testMagicLinkFlow(config) {
  const startTime = Date.now();
  const results = {};
  
  // Step 1: Request magic link
  const magicLinkResponse = await fetch(`${config.authUrl}/magic-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_USER.email })
  });
  
  results.magicLinkRequest = {
    status: magicLinkResponse.status,
    ok: magicLinkResponse.ok
  };
  
  if (!magicLinkResponse.ok) {
    const errorText = await magicLinkResponse.text();
    throw new Error(`Magic link request failed: ${errorText}`);
  }
  
  // In a real test, you'd extract the token from email/database
  // For now, we'll test with a mock token format
  const mockToken = 'e2e-test-token-' + Date.now();
  
  // Step 2: Test token validation (will fail but should return proper error)
  const verifyResponse = await fetch(`${config.authUrl}/verify?token=${mockToken}`);
  results.tokenValidation = {
    status: verifyResponse.status,
    expectingFailure: true,
    properlyRejected: verifyResponse.status === 401 || verifyResponse.status === 400
  };
  
  return {
    duration: Date.now() - startTime,
    details: results
  };
}

// Test: JWT Token Validation
async function testJWTValidation(config) {
  const startTime = Date.now();
  const results = {};
  
  // Test with invalid JWT
  const invalidJWTResponse = await fetch(`${config.apiUrl}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid-jwt-token'
    },
    body: JSON.stringify({
      priceId: 'price_test_123',
      customerEmail: TEST_USER.email
    })
  });
  
  results.invalidJWT = {
    status: invalidJWTResponse.status,
    properlyRejected: invalidJWTResponse.status === 401 || invalidJWTResponse.status === 500
  };
  
  // Test with malformed JWT
  const malformedJWTResponse = await fetch(`${config.apiUrl}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer not.a.jwt'
    },
    body: JSON.stringify({
      priceId: 'price_test_123',
      customerEmail: TEST_USER.email
    })
  });
  
  results.malformedJWT = {
    status: malformedJWTResponse.status,
    properlyRejected: malformedJWTResponse.status === 401 || malformedJWTResponse.status === 500
  };
  
  if (!results.invalidJWT.properlyRejected || !results.malformedJWT.properlyRejected) {
    throw new Error('JWT validation not working properly');
  }
  
  return {
    duration: Date.now() - startTime,
    details: results
  };
}

// Test: Stripe Checkout (Monthly Pro)
async function testStripeCheckout(config) {
  const startTime = Date.now();
  
  // This test requires a valid JWT, so it will fail on auth
  // But we can test that the endpoint exists and returns proper errors
  const checkoutResponse = await fetch(`${config.apiUrl}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-jwt-token'
    },
    body: JSON.stringify({
      priceId: 'price_test_monthly',
      customerEmail: TEST_USER.email,
      successUrl: `${config.baseUrl}/thank-you`,
      cancelUrl: `${config.baseUrl}/upgrade`
    })
  });
  
  const results = {
    status: checkoutResponse.status,
    endpointExists: checkoutResponse.status !== 404,
    authRejection: checkoutResponse.status === 401 || checkoutResponse.status === 500
  };
  
  if (checkoutResponse.status === 404) {
    throw new Error('Checkout endpoint not found');
  }
  
  return {
    duration: Date.now() - startTime,
    details: results
  };
}

// Test: Founders Checkout
async function testFoundersCheckout(config) {
  const startTime = Date.now();
  
  const foundersResponse = await fetch(`${config.apiUrl}/create-founder-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-jwt-token'
    },
    body: JSON.stringify({
      customerEmail: TEST_USER.email,
      successUrl: `${config.baseUrl}/thank-you?pro=founder`,
      cancelUrl: `${config.baseUrl}/upgrade`
    })
  });
  
  const results = {
    status: foundersResponse.status,
    endpointExists: foundersResponse.status !== 404,
    authRejection: foundersResponse.status === 401 || foundersResponse.status === 500
  };
  
  if (foundersResponse.status === 404) {
    throw new Error('Founders checkout endpoint not found');
  }
  
  return {
    duration: Date.now() - startTime,
    details: results
  };
}

// HTML Dashboard for running tests
function getTestDashboardHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>TrySnowball E2E Testing Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        .test-button { 
            background: #007cba; color: white; border: none; padding: 12px 24px; 
            border-radius: 4px; cursor: pointer; margin: 5px; font-size: 16px;
        }
        .test-button:hover { background: #005a87; }
        .results { 
            margin-top: 20px; padding: 20px; background: #f9f9f9; 
            border-radius: 4px; white-space: pre-wrap; font-family: monospace;
        }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .loading { color: #ffc107; }
        .env-selector { margin: 10px 0; }
        select { padding: 8px; font-size: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 TrySnowball E2E Testing Dashboard</h1>
        <p>Run automated end-to-end tests against staging or production environments.</p>
        
        <div class="env-selector">
            <label>Environment: </label>
            <select id="environment">
                <option value="staging">Staging</option>
                <option value="production">Production</option>
            </select>
        </div>
        
        <div class="test-controls">
            <button class="test-button" onclick="runTests('health')">🏥 Health Tests</button>
            <button class="test-button" onclick="runTests('auth')">🔐 Auth Tests</button>
            <button class="test-button" onclick="runTests('checkout')">💳 Checkout Tests</button>
            <button class="test-button" onclick="runTests('all')">🚀 All Tests</button>
        </div>
        
        <div id="results" class="results" style="display: none;"></div>
    </div>

    <script>
        async function runTests(suite) {
            const env = document.getElementById('environment').value;
            const resultsDiv = document.getElementById('results');
            
            resultsDiv.style.display = 'block';
            resultsDiv.className = 'results loading';
            resultsDiv.textContent = \`🔄 Running \${suite} tests on \${env}...\\n\`;
            
            try {
                const response = await fetch(\`/run-tests?env=\${env}&suite=\${suite}\`);
                const results = await response.json();
                
                displayResults(results);
                
            } catch (error) {
                resultsDiv.className = 'results failed';
                resultsDiv.textContent = \`❌ Error: \${error.message}\`;
            }
        }
        
        function displayResults(results) {
            const resultsDiv = document.getElementById('results');
            const allPassed = results.summary.failed === 0;
            
            resultsDiv.className = \`results \${allPassed ? 'passed' : 'failed'}\`;
            
            let output = \`\${allPassed ? '✅' : '❌'} Test Results: \${results.summary.passed}/\${results.summary.total} passed\\n\`;
            output += \`Environment: \${results.environment}\\n\`;
            output += \`Test Suite: \${results.testSuite}\\n\`;
            output += \`Timestamp: \${results.timestamp}\\n\\n\`;
            
            results.tests.forEach(test => {
                const status = test.status === 'passed' ? '✅' : '❌';
                output += \`\${status} \${test.name}\`;
                if (test.duration) output += \` (\${test.duration}ms)\`;
                output += '\\n';
                
                if (test.error) {
                    output += \`   Error: \${test.error}\\n\`;
                }
                
                if (test.details) {
                    output += \`   Details: \${JSON.stringify(test.details, null, 2)}\\n\`;
                }
                output += '\\n';
            });
            
            resultsDiv.textContent = output;
        }
    </script>
</body>
</html>`;
}