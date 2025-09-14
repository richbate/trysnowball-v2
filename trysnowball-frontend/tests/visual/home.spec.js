// Basic visual regression test for the home page
const { test, expect } = require('@playwright/test');

test('Home page visual snapshot', async ({ page }) => {
  // Set localStorage to skip onboarding
  await page.addInitScript(() => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    localStorage.setItem('onboarding_completed', 'true');
  });
  
  await page.goto('http://localhost:3000');
  
  // Wait for the main content to load
  await page.waitForTimeout(2000);
  
  await expect(page).toHaveScreenshot('home.png');
});