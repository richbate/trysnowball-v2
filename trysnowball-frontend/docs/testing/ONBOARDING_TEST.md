# 🎯 First-Time User Onboarding - Testing Guide

⚠️ **Do NOT access `.data` on any manager.** Always use the async facade (e.g., `debtsManager.getData()` / `getMetrics()`). Direct `.data` access will crash in production and is blocked by ESLint, dev proxy guard, and CI.

## Quick Test (2 minutes)

### 1. Reset to First-Time User State
```javascript
// In browser console at http://localhost:3000
localStorage.clear();
location.reload();
```

### 2. Expected Flow
✅ **Homepage** → Should immediately show onboarding overlay  
✅ **Step 1** → Choose goal (Pay off debt faster, Stop paycheck cycle, Get organized)  
✅ **Step 2** → Choose situation (Getting started, Making progress, Optimizing)  
✅ **Completion** → Redirects to `/debts` with contextual welcome message  

### 3. PostHog Events to Verify
Check PostHog dashboard for these events:
- `onboarding_started`
- `onboarding_goal_selected` 
- `onboarding_situation_selected`
- `onboarding_completed`

### 4. localStorage After Completion
```javascript
// Should be set:
// ✅ Use settings hook instead of localStorage
const { settings } = useSettings();
settings.onboardingCompleted  // true
settings.userGoal            // e.g., 'pay_off_debt'  
settings.userSituation       // e.g., 'getting_started'
settings.userSegment         // e.g., 'pay_off_debt_getting_started'
settings.journeyStart        // ISO date string
```

## Test Scenarios

### Scenario 1: "Pay off debt faster" + "Getting started"
- **Expected message**: "Let's create your debt payoff plan! 🎯"
- **Description**: "Add your debts below to see your optimized payoff strategy"

### Scenario 2: "Stop paycheck cycle" + "Making progress"  
- **Expected message**: "Time to build breathing room! 💰"
- **Description**: "Add your debts to see how much budget space we can create"

### Scenario 3: "Get organized" + "Optimizing"
- **Expected message**: "Let's get your finances organized! 📊"
- **Description**: "Add your debts to get a clear picture of your financial situation"

## Edge Cases to Test

### Skip Onboarding
- Click "Skip setup" → Should go to homepage, track `onboarding_abandoned`
- Should set `onboarding_completed: 'true'` and `onboarding_skipped: 'true'`

### Back Button
- Step 2 → Back → Should return to Step 1 with previous selection preserved

### Page Refresh
- Refresh during onboarding → Should track `onboarding_abandoned`

### Returning User
- Complete onboarding once → Visit homepage again → Should NOT show onboarding

### Mobile Experience
- Test responsive design on mobile viewport
- Touch interactions should work smoothly

## Analytics Validation

### Event Properties to Check
```javascript
// onboarding_completed event should include:
{
  primary_goal: 'pay_off_debt',
  current_situation: 'getting_started', 
  completion_time_seconds: 45,
  user_segment: 'pay_off_debt_getting_started'
}
```

### User Properties Set
```javascript
// PostHog user properties should include:
{
  primary_goal: 'pay_off_debt',
  current_situation: 'getting_started',
  onboarding_completed_date: '2025-01-08T10:30:00.000Z',
  user_segment: 'pay_off_debt_getting_started'
}
```

## Success Criteria ✅

- [ ] Onboarding shows for first-time users only
- [ ] Both questions require selection to continue  
- [ ] All PostHog events fire correctly
- [ ] Contextual messaging appears on debt page
- [ ] Skip functionality works
- [ ] Back button works on step 2
- [ ] Mobile responsive
- [ ] Clean URL after completion
- [ ] localStorage data persists correctly
- [ ] Returning users bypass onboarding

## Performance Notes
- Component should load quickly (< 500ms)
- Smooth transitions between steps
- No JavaScript errors in console
- PostHog events should not block UI

---

🚀 **Ready to ship!** This onboarding flow will give you valuable user intent data and improve first-time user experience significantly.