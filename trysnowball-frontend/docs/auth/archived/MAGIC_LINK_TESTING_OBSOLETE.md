# Magic Link Authentication Testing Guide

## Quick Automated Test

Run the automated test script:
```bash
./scripts/test-magic-link.sh https://trysnowball.co.uk
```

This tests the backend flow but **does not test browser integration**.

## Manual Browser Testing (Required)

### Prerequisites
- Open browser dev tools (F12)
- Clear localStorage: `localStorage.clear()`
- Open Network tab to monitor requests

### Step-by-Step Testing

#### 1. Request Magic Link
1. Go to `https://trysnowball.co.uk/login` (or wherever magic link form is)
2. Enter email: `demo@trysnowball.local`
3. Click submit
4. **Verify**: Network tab shows 200 response from `/auth/request-link`

#### 2. Click Magic Link (Critical Test)
1. **Before clicking**: Note your current URL
2. **Click magic link** (from email or debug response)
3. **Monitor Network tab**: Should see:
   - Request to `/auth/verify?token=...`
   - 302 redirect response
   - Follow redirect to `/auth/success?token=...`
4. **Expected outcome**: You should end up on homepage, logged in

#### 3. Verify Token Storage
Open browser console and run:
```javascript
// Check if token is stored correctly
const token = localStorage.getItem('token');
console.log('Token stored:', !!token);
if (token) {
  console.log('Token preview:', token.substring(0, 50) + '...');
} else {
  console.log('❌ NO TOKEN FOUND');
}
```

#### 4. Verify User State
```javascript
// Check user authentication state
fetch('/api/user', {  // ✅ Updated endpoint
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(user => console.log('User state:', user))
.catch(err => console.log('❌ Auth failed:', err));
```

#### 5. Test Authenticated Features
1. Navigate to `/ai/coach` or other Pro features
2. **Check Network tab**: Should see Authorization headers on API calls
3. **Check Console**: Should be no 401 errors
4. **Expected**: Features should work without "Missing token" errors

## Common Failure Modes & Debugging

### Issue: Magic Link Goes to Homepage Instead of Login Success
**Symptom**: Clicking magic link goes to `trysnowball.co.uk` instead of `trysnowball.co.uk/auth/success`
**Check**: 
```bash
curl -I "https://trysnowball.co.uk/auth/verify?token=DUMMY_TOKEN"
```
**Expected**: `Location: https://trysnowball.co.uk/auth/success?token=...`
**Fix**: Update `functions/auth/verify.js` redirect URL

### Issue: Token Not Saved to localStorage
**Symptom**: `localStorage.getItem('token')` returns `null`
**Check**: 
- Does URL contain `?token=...` parameter?
- Does LoginSuccess component load?
- Are there JavaScript errors in console?
**Fix**: Verify LoginSuccess extracts token from URL params correctly

### Issue: 401 Errors Despite Having Token
**Symptom**: API calls return 401 even with token in localStorage
**Check**:
```javascript
// Verify token format
const token = localStorage.getItem('token');
try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token payload:', payload);
  console.log('Token expires:', new Date(payload.exp * 1000));
} catch (e) {
  console.log('❌ Invalid token format:', e);
}
```
**Fix**: Check JWT is valid and not expired

### Issue: UserContext Not Updating
**Symptom**: User appears logged out despite having valid token
**Check**: Look for `auth-success` event in Network/Console
**Fix**: Verify LoginSuccess dispatches event and UserContext listens

## Success Criteria Checklist

- [ ] Magic link request returns 200
- [ ] Magic link redirects to `/auth/success?token=...`
- [ ] Token stored in `localStorage['token']`
- [ ] `/api/user` returns user data (not 401)
- [ ] No console errors on page load
- [ ] Authenticated features work without errors
- [ ] Page refresh maintains logged-in state

## Test Results Template

```
Date: ___________
Environment: ___________
Browser: ___________

✅/❌ Magic link request successful
✅/❌ Magic link redirects correctly  
✅/❌ Token stored in localStorage
✅/❌ User state updated
✅/❌ API calls authenticated
✅/❌ No console errors

Issues found:
_________________________________
_________________________________

Next steps:
_________________________________
_________________________________
```