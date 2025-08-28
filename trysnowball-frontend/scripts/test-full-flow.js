#!/usr/bin/env node
/**
 * Comprehensive Magic Link Flow Test
 * Tests the complete flow including token extraction and validation
 */

const https = require('https');
const { URL } = require('url');

const BASE_URL = process.argv[2] || 'https://trysnowball.co.uk';
const TEST_EMAIL = 'demo@trysnowball.local';

console.log('🔗 Comprehensive Magic Link Authentication Test');
console.log(`Environment: ${BASE_URL}`);
console.log(`Test Email: ${TEST_EMAIL}\n`);

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testMagicLinkFlow() {
  try {
    // Step 1: Request magic link
    console.log('📧 Step 1: Requesting magic link...');
    
    const requestResponse = await makeRequest(`${BASE_URL}/auth/request-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: TEST_EMAIL })
    });

    if (requestResponse.statusCode !== 200) {
      console.log(`❌ Magic link request failed: ${requestResponse.statusCode}`);
      console.log(`Response: ${requestResponse.body}`);
      return;
    }

    console.log('✅ Magic link request successful');
    
    const requestData = JSON.parse(requestResponse.body);
    console.log(`   Message: ${requestData.message}`);
    
    // Check if debug link is available
    if (requestData.link) {
      console.log('🔍 Debug mode detected, testing full flow...');
      
      const magicLinkUrl = new URL(requestData.link);
      const token = magicLinkUrl.searchParams.get('token');
      
      if (!token) {
        console.log('❌ No token found in magic link');
        return;
      }
      
      console.log(`   Token preview: ${token.substring(0, 20)}...`);
      
      // Step 2: Test magic link verification with redirect following
      console.log('\n🔐 Step 2: Testing magic link verification...');
      
      const verifyResponse = await makeRequest(`${BASE_URL}/auth/verify?token=${token}`, {
        // Don't follow redirects automatically to see the redirect response
      });
      
      console.log(`   Verify response: ${verifyResponse.statusCode}`);
      
      if (verifyResponse.statusCode === 302) {
        const location = verifyResponse.headers.location;
        console.log(`✅ Redirect response received`);
        console.log(`   Location: ${location}`);
        
        // Check if redirect URL is correct
        if (location && location.includes('/auth/success')) {
          console.log('✅ Redirects to correct LoginSuccess page');
          
          // Extract token from redirect URL
          const redirectUrl = new URL(location);
          const redirectToken = redirectUrl.searchParams.get('token');
          
          if (redirectToken) {
            console.log('✅ Token preserved in redirect');
            console.log(`   Redirect token preview: ${redirectToken.substring(0, 20)}...`);
            
            // Step 3: Test the token with /auth/me
            console.log('\n🛡️  Step 3: Testing token validity...');
            
            const meResponse = await makeRequest(`${BASE_URL}/auth/me`, {
              headers: {
                'Authorization': `Bearer ${redirectToken}`
              }
            });
            
            if (meResponse.statusCode === 200) {
              console.log('✅ Token is valid - user authenticated');
              const userData = JSON.parse(meResponse.body);
              console.log(`   User: ${userData.email} (Pro: ${userData.isPro})`);
            } else {
              console.log(`❌ Token validation failed: ${meResponse.statusCode}`);
              console.log(`   Response: ${meResponse.body}`);
            }
          } else {
            console.log('❌ Token missing from redirect URL');
          }
        } else {
          console.log(`❌ Redirects to wrong location: ${location}`);
        }
      } else if (verifyResponse.statusCode === 200) {
        console.log('✅ Direct success response (API mode)');
        const userData = JSON.parse(verifyResponse.body);
        console.log(`   User: ${userData.email}`);
      } else {
        console.log(`❌ Verification failed: ${verifyResponse.statusCode}`);
        console.log(`   Response: ${verifyResponse.body}`);
      }
    } else {
      console.log('⚠️  Production mode - no debug link available');
      console.log('   Manual browser testing required');
    }
    
    // Step 4: Test endpoint health
    console.log('\n🏥 Step 4: Testing auth service health...');
    
    const healthResponse = await makeRequest(`${BASE_URL}/auth/health`);
    
    if (healthResponse.statusCode === 200) {
      console.log('✅ Auth service healthy');
      const healthData = JSON.parse(healthResponse.body);
      console.log(`   Endpoints: ${healthData.endpoints.join(', ')}`);
    } else {
      console.log(`❌ Auth service unhealthy: ${healthResponse.statusCode}`);
    }
    
  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
  }
}

// Run the test
testMagicLinkFlow().then(() => {
  console.log('\n📋 Test Complete');
  console.log('\n🧪 Next Steps:');
  console.log('1. Run browser test following MAGIC_LINK_TESTING.md');
  console.log('2. Verify localStorage token storage works');
  console.log('3. Test authenticated features in browser');
});