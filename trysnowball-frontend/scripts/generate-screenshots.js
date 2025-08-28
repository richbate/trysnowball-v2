#!/usr/bin/env node

/**
 * TrySnowball Screenshot Generator
 * 
 * Automatically captures screenshots of all app pages including auth-gated content.
 * Uses magic-link authentication to access protected routes.
 * 
 * Usage:
 *   node scripts/generate-screenshots.js
 *   node scripts/generate-screenshots.js --email=your@email.com --base=http://localhost:3000
 * 
 * Requirements:
 *   npm install puppeteer
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  baseUrl: process.env.SCREENSHOT_BASE_URL || 'https://trysnowball.co.uk',
  email: process.env.SCREENSHOT_EMAIL || 'demo@trysnowball.co.uk',
  outputDir: 'screenshots',
  timeout: 10000,
  viewport: {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2 // Retina quality
  }
};

// Parse command line arguments
process.argv.forEach(arg => {
  if (arg.startsWith('--base=')) {
    config.baseUrl = arg.split('=')[1];
  }
  if (arg.startsWith('--email=')) {
    config.email = arg.split('=')[1];
  }
});

// Routes to screenshot (order matters for slide deck)
const routes = [
  // Public pages
  { path: '/', name: '01-home', title: 'Homepage' },
  { path: '/how-it-works', name: '02-how-it-works', title: 'How It Works' },
  { path: '/library', name: '03-library', title: 'Knowledge Library' },
  
  // Auth flow
  { path: '/auth/login', name: '04-login', title: 'Login Page' },
  
  // Protected pages (require authentication)
  { path: '/my-plan', name: '05-my-plan', title: 'My Debt Plan', requiresAuth: true },
  { path: '/my-plan?tab=debts', name: '06-debts-tab', title: 'Debts Management', requiresAuth: true },
  { path: '/my-plan?tab=strategy', name: '07-strategy-tab', title: 'Payment Strategy', requiresAuth: true },
  { path: '/my-plan?tab=forecast', name: '08-forecast-tab', title: 'Debt-Free Forecast', requiresAuth: true },
  { path: '/my-plan?tab=goals', name: '09-goals-tab', title: 'Financial Goals', requiresAuth: true },
  { path: '/coach', name: '10-ai-coach', title: 'AI Debt Coach', requiresAuth: true },
  { path: '/profile', name: '11-profile', title: 'Profile Settings', requiresAuth: true },
  
  // Additional public pages
  { path: '/upgrade', name: '12-upgrade', title: 'Upgrade Plans' },
  { path: '/security', name: '13-security', title: 'Security & Privacy' },
];

/**
 * Handle magic link authentication
 */
async function authenticateWithMagicLink(page) {
  console.log(`📧 Requesting magic link for ${config.email}...`);
  
  try {
    // Go to login page
    await page.goto(`${config.baseUrl}/auth/login`, { waitUntil: 'networkidle2' });
    
    // Fill email and submit
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', config.email);
    
    // Click submit button (could be input[type="submit"] or button)
    const submitSelector = 'input[type="submit"], button[type="submit"], button:contains("Send")';
    await page.click(submitSelector);
    
    console.log('✅ Magic link request sent');
    console.log('⏳ Waiting for manual magic link click...');
    console.log(`💡 Check your email (${config.email}) and click the magic link`);
    console.log('   The script will continue once you\'re authenticated');
    
    // Wait for successful auth redirect (look for auth success or main app)
    try {
      await page.waitForFunction(
        () => {
          return window.location.pathname === '/auth/success' || 
                 window.location.pathname === '/my-plan' ||
                 window.location.pathname === '/' ||
                 document.cookie.includes('token') ||
                 localStorage.getItem('token') ||
                 localStorage.getItem('trysnowball-auth-token');
        },
        { timeout: 300000 } // 5 minutes to click the link
      );
      
      console.log('✅ Authentication successful!');
      
      // Wait a bit more for app to fully load
      await page.waitForTimeout(2000);
      
      return true;
    } catch (error) {
      console.log('⚠️  Auth timeout - continuing with public pages only');
      return false;
    }
    
  } catch (error) {
    console.log('⚠️  Magic link auth failed - continuing with public pages only');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Take screenshot of a page
 */
async function screenshotPage(page, route, index, total) {
  const url = `${config.baseUrl}${route.path}`;
  console.log(`📸 [${index}/${total}] ${route.title}: ${url}`);
  
  try {
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: config.timeout 
    });
    
    // Wait for page to be fully rendered
    await page.waitForTimeout(2000);
    
    // Handle any modals or overlays that might block the view
    try {
      // Close any welcome modals, cookie banners, etc.
      const modalCloseBtns = await page.$$('[data-dismiss="modal"], .modal-close, [aria-label="Close"]');
      for (const btn of modalCloseBtns) {
        await btn.click();
        await page.waitForTimeout(500);
      }
    } catch (e) {
      // Ignore modal closing errors
    }
    
    // Scroll to top to ensure consistent screenshots
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const filepath = path.join(config.outputDir, `${route.name}.png`);
    await page.screenshot({
      path: filepath,
      fullPage: true,
      captureBeyondViewport: false
    });
    
    console.log(`✅ Saved: ${filepath}`);
    
  } catch (error) {
    console.log(`❌ Failed to screenshot ${route.name}: ${error.message}`);
  }
}

/**
 * Generate PDF from screenshots using system convert command
 */
async function generatePDF() {
  console.log('\n📄 Generating PDF slide deck...');
  
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    // Check if ImageMagick convert is available
    await execPromise('convert -version');
    
    // Generate PDF from screenshots
    const pdfPath = path.join(config.outputDir, 'trysnowball-slides.pdf');
    const pngPattern = path.join(config.outputDir, '*.png');
    
    await execPromise(`convert "${pngPattern}" "${pdfPath}"`);
    console.log(`✅ PDF generated: ${pdfPath}`);
    
  } catch (error) {
    if (error.message.includes('convert: not found') || error.message.includes('command not found')) {
      console.log('⚠️  ImageMagick not found. Install it to auto-generate PDF:');
      console.log('   macOS: brew install imagemagick');
      console.log('   Ubuntu: sudo apt-get install imagemagick');
      console.log('   Or manually combine PNGs into a slide deck');
    } else {
      console.log(`❌ PDF generation failed: ${error.message}`);
    }
  }
}

/**
 * Main screenshot generation function
 */
async function generateScreenshots() {
  console.log('🚀 Starting TrySnowball screenshot generation...');
  console.log(`📍 Base URL: ${config.baseUrl}`);
  console.log(`📧 Auth Email: ${config.email}`);
  
  // Ensure output directory exists
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: config.viewport,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });
  
  const page = await browser.newPage();
  
  // Set realistic user agent
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    // Authenticate if we have auth-required pages
    const hasAuthPages = routes.some(r => r.requiresAuth);
    let isAuthenticated = false;
    
    if (hasAuthPages) {
      isAuthenticated = await authenticateWithMagicLink(page);
    }
    
    // Screenshot all pages
    let screenshotCount = 0;
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      
      // Skip auth pages if not authenticated
      if (route.requiresAuth && !isAuthenticated) {
        console.log(`⏭️  Skipping ${route.title} (requires authentication)`);
        continue;
      }
      
      await screenshotPage(page, route, i + 1, routes.length);
      screenshotCount++;
    }
    
    console.log(`\n🎉 Generated ${screenshotCount} screenshots in ${config.outputDir}/`);
    
    // Generate PDF if we have screenshots
    if (screenshotCount > 0) {
      await generatePDF();
    }
    
    console.log('\n📚 Next steps:');
    console.log(`   1. Review screenshots in ${config.outputDir}/`);
    console.log('   2. Import PNGs into Keynote/PowerPoint for your slide deck');
    console.log('   3. Add titles, annotations, and transitions as needed');
    
  } catch (error) {
    console.error('❌ Screenshot generation failed:', error);
  } finally {
    await browser.close();
  }
}

// Help text
function showHelp() {
  console.log(`
TrySnowball Screenshot Generator

Usage:
  node scripts/generate-screenshots.js [options]

Options:
  --base=URL     Base URL (default: https://trysnowball.co.uk)
  --email=EMAIL  Email for auth (default: demo@trysnowball.co.uk)
  --help         Show this help

Examples:
  node scripts/generate-screenshots.js
  node scripts/generate-screenshots.js --base=http://localhost:3000
  node scripts/generate-screenshots.js --email=your@email.com

Environment Variables:
  SCREENSHOT_BASE_URL    Base URL override
  SCREENSHOT_EMAIL       Email override
`);
}

// Run the script
if (process.argv.includes('--help')) {
  showHelp();
} else {
  generateScreenshots().catch(console.error);
}