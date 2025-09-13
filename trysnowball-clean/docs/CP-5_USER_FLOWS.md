# CP-5 User Flows & Experience Design
**Status**: SPEC | **Components**: GoalsPage, GoalCard, EntitlementGate

## Tier-Based Journey Maps

### Free Tier Flow (Default Config)
**Entitlements**: 1 active goal, DEBT_CLEAR type only

1. **Goal Discovery**
   - See goals feature in navigation/dashboard
   - "Set your first debt clearance goal" CTA
   
2. **Goal Creation** 
   - Select debt to target
   - Choose target date
   - Goal type automatically set to DEBT_CLEAR
   - Analytics: `goal_created`
   
3. **Active Goal State**
   - Single goal card showing progress
   - Forecast integration shows projected vs target date
   - Progress updates on debt balance changes
   
4. **Entitlement Block**
   - User tries to create 2nd goal
   - Blocked with upgrade prompt: "Unlock unlimited goals with Pro"
   - Analytics: `entitlement_blocked`
   
5. **Goal Outcome**
   - Achievement: Celebration + `goal_achieved` event
   - Failure: Encouragement + option to create new goal

### Pro Tier Flow
**Entitlements**: 10 active goals, all goal types, bucket targeting

1. **Enhanced Goal Discovery**
   - Multiple goal type options
   - Bucket-level targeting available
   - System challenges suggested
   
2. **Advanced Goal Creation**
   - Choose from 4 goal types
   - Target specific debts or buckets
   - Set custom amounts and dates
   
3. **Multi-Goal Management**
   - Dashboard shows all active goals
   - Progress bars for each goal
   - Priority indicators and completion dates
   
4. **System Challenges**
   - Auto-suggested based on forecast analysis
   - "You're on track to clear cash advances 2 months early - set a challenge?"
   - Analytics: `challenge_assigned`

## Detailed User Flows

### Flow 1: Goal Creation Journey

```
1. User clicks "Set Goal" CTA
   ↓
2. Entitlement Check (goals.max_active)
   ├─ PASS: Show goal creation form
   └─ FAIL: Show upgrade prompt + log entitlement_blocked
   ↓
3. Goal Type Selection
   ├─ Free: Only DEBT_CLEAR option
   └─ Pro: All 4 types available
   ↓
4. Target Configuration
   ├─ Debt/Bucket selection (Pro: buckets available)
   ├─ Target value input
   └─ Target date picker
   ↓
5. Goal Created
   ├─ Analytics: goal_created
   ├─ UI: Success message + goal card
   └─ Integration: Link to forecast updates
```

### Flow 2: Progress Tracking Experience

```
Daily/Weekly:
1. User updates debt balances
   ↓
2. Forecast engine recalculates
   ↓
3. Goals engine checks achievement conditions
   ↓
4. If significant progress: Analytics goal_progressed
   ↓
5. UI updates goal cards with new progress
   ↓
6. Push notifications for milestones (future)
```

### Flow 3: Goal Achievement Celebration

```
1. Achievement condition met (forecast check)
   ↓
2. Analytics: goal_achieved
   ↓
3. UI: Achievement modal/toast
   ├─ Celebration animation
   ├─ Share achievement option
   └─ "Set your next goal" CTA
   ↓
4. Goal status → ACHIEVED
   ↓
5. Goal moves to achievements history
```

### Flow 4: Entitlement Block & Upgrade

```
1. User action exceeds entitlement
   ↓
2. Analytics: entitlement_blocked
   ↓
3. Block action with explanation
   ├─ "You've reached your goal limit (1/1)"
   ├─ "Unlock unlimited goals with Pro"
   └─ Upgrade CTA button
   ↓
4. If user upgrades:
   ├─ Entitlements refresh
   ├─ Previously blocked action now available
   └─ Analytics: conversion tracking
```

## UI Component Integration

### GoalsPage Layout
```jsx
<GoalsPage>
  <GoalsHeader />
  <ActiveGoalsGrid>
    {goals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
    {canCreateMore && <CreateGoalCard />}
    {!canCreateMore && <UpgradePromptCard />}
  </ActiveGoalsGrid>
  <AchievementsHistory />
  <SystemChallenges tier="pro" />
</GoalsPage>
```

### GoalCard States
- **ACTIVE**: Progress bar, forecast integration, edit/cancel options
- **ACHIEVED**: Celebration styling, share button, archive option  
- **FAILED**: Encouragement message, "Try again" CTA
- **CANCELLED**: Neutral styling, reason tracking

### EntitlementGate Component
```jsx
<EntitlementGate 
  feature="goals.max_active" 
  userTier={userTier}
  onBlock={(feature, limit) => showUpgradePrompt(feature, limit)}
  onAllow={() => showGoalCreationForm()}
>
  <CreateGoalButton />
</EntitlementGate>
```

## Messaging & Copy Strategy

### Achievement Messages
- **DEBT_CLEAR**: "🎉 [Debt Name] paid off! You did it!"
- **AMOUNT_PAID**: "💪 £[amount] paid toward [debt] - goal crushed!"
- **INTEREST_SAVED**: "💰 You saved £[amount] in interest - money in your pocket!"
- **TIMEBOUND**: "⚡ Debt-free by [date] - you're ahead of schedule!"

### Failure Messages (Encouraging)
- **DEBT_CLEAR**: "Almost there! [Debt] will be clear in [X] more months."
- **AMOUNT_PAID**: "You paid £[current] of £[target] - solid progress!"
- **TIMEBOUND**: "Your debt-free date moved to [new_date] - still crushing it!"

### Entitlement Block Messages
- **Free → Pro**: "Unlock unlimited goals, bucket targeting, and challenges with Pro"
- **Feature Specific**: "Advanced goal types available with Pro subscription"
- **Value Focused**: "Pro users achieve their goals 40% faster on average"

## Analytics Integration Points

Each flow stage fires appropriate analytics:
- **Discovery**: Page views, CTA clicks
- **Creation**: `goal_created`, entitlement checks
- **Progress**: `goal_progressed` (batched)
- **Outcomes**: `goal_achieved`, `goal_failed`
- **Blocks**: `entitlement_blocked` with conversion tracking