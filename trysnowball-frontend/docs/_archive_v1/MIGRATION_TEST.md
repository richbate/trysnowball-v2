# Migration Testing Script

Copy/paste these into your browser console to test migration scenarios:

## A. Existing user w/ legacy token
```javascript
// Setup legacy token
localStorage.setItem('jwt','abc123'); 
localStorage.removeItem('ts_jwt');
console.log('Setup: Legacy token in place');

// Test token migration
import('./src/lib/auth/token.ts').then(({ getAuthToken }) => {
  const token = getAuthToken();
  console.log('Migration test result:', token === 'abc123' ? 'SUCCESS' : 'FAILED');
  console.log('New ts_jwt exists:', localStorage.getItem('ts_jwt') ? 'YES' : 'NO');
});
```

## B. No token, old cookie session  
```javascript
// Clear localStorage but keep cookies
localStorage.clear(); 
console.log('Setup: No tokens, relying on cookies');

// Test cookie fallback (should work if you have valid session cookies)
fetch('/api/debts', { credentials: 'include' })
  .then(r => r.ok ? 'Cookie auth works' : 'Cookie auth failed')
  .then(console.log);
```

## C. Expired everything
```javascript
// Clear everything
localStorage.clear(); 
sessionStorage.clear();
// Note: Can't clear httpOnly cookies from JS
console.log('Setup: Everything cleared');

// Should fail gracefully
fetch('/api/debts', { credentials: 'include' })
  .then(r => console.log('Should fail:', r.status))
  .catch(e => console.log('Expected failure:', e.message));
```

## D. Regression guard test
```javascript
// Simulate scenario where local has data but remote is empty
console.log('Test: Local data should be preserved when remote fails');
// This is handled by useUserDebts.js fallback logic
```