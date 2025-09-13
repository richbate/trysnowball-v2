# CP-4 User Flows & Experience Design
**Status**: DOCUMENTED | **UI Components**: ForecastPage, BucketMilestones, InterestBreakdown

## Forecast Journey (Free vs Pro)

### Free User Flow
1. **Debt Entry**: Single APR per debt only
2. **Simulation**: Uses v1.0 flat engine (`snowballSimulator.ts`)
3. **Results**: Standard milestone dates, total interest
4. **Comparison**: Minimum vs snowball payments
5. **Upgrade Prompt**: "Pro users save X months with multi-APR precision"

### Pro User Flow  
1. **Debt Entry**: Optional bucket creation with multiple APRs
2. **Simulation**: Uses v2.0 composite engine when buckets present
3. **Results**: Bucket-level milestones + debt-level milestones
4. **Comparison**: Composite vs flat simulation benefits
5. **Warning Banner**: Limitations disclosure for transparency

## Milestone Celebrations

### Bucket Milestones (Pro Only)
- **Event**: `bucket_cleared` analytics fired
- **UI**: BucketMilestones component shows progress
- **Celebration**: Toast notification when bucket paid off
- **Details**: APR, month cleared, interest saved per bucket

### Debt Milestones (All Users)
- **Event**: Standard debt completion  
- **UI**: Traditional milestone dates
- **Celebration**: Major milestone notifications
- **Rollover**: Snowball amount increases for next debt

## Comparison Flow

### Automatic Comparison (useCompareForecast)
- **Trigger**: Any forecast with `extraPerMonth > 0`
- **Analytics**: `forecast_compared` event fired when savings > 0
- **UI Display**: Impact summary showing months/interest saved
- **Messaging**: "By paying £X extra, you save Y months and £Z interest"

### Pro Justification
- **Composite vs Flat**: Shows precise APR targeting benefits
- **Savings Calculation**: "Composite forecast saves you N months" 
- **Feature Value**: Demonstrates Pro subscription ROI

## Interest Breakdown UX

### Transparency Panel (InterestBreakdown component)
- **Analytics**: `bucket_interest_breakdown` fired on display
- **Content**: Reconciles with forecast totals exactly
- **Education**: "Your highest APR buckets (Cash Advances at 27.9%) are targeted first"
- **Trust Building**: Shows mathematical precision vs "black box"

### Composite Mode Details
- **Per-Bucket Interest**: Individual APR calculations shown
- **Payment Allocation**: Visual of proportional minimum distribution
- **Priority Explanation**: Why cash advances get snowball first

## Warning & Disclosure System

### Composite Mode Banner
- **Trigger**: When `simulationEngine === 'v2-composite'`
- **Content**: Key assumptions (fixed APRs, proportional minimums)
- **Call-to-Action**: Link to full limitations documentation
- **Legal**: "Estimates based on assumptions - verify with your provider"

### Limitations Panel (Dev Mode)
- **Audience**: Power users and developers
- **Content**: Technical model assumptions
- **Comparison**: Model vs real-world variations
- **Updates**: Links to review schedule and feedback