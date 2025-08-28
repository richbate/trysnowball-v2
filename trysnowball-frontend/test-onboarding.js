// Quick onboarding test script
// Run this in browser console at http://localhost:3000

console.log('🧪 Testing Onboarding Flow...');

// Step 1: Check current state
console.log('Current onboarding state:', localStorage.getItem('onboarding_completed'));

// Step 2: Clear localStorage to simulate first-time user
console.log('Clearing localStorage...');
localStorage.clear();

// Step 3: Reload page
console.log('Reloading page to trigger onboarding...');
location.reload();

// After reload, you should see:
// 1. Debug logs showing shouldShowOnboarding: true
// 2. Onboarding overlay with Step 1 of 2
// 3. Goal selection options