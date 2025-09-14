# 🧪 A/B Test: Hero CTA Variants

**Test Name**: `hero_cta`  
**Location**: Landing page hero section  
**Status**: ✅ Live  

## 📊 Variants

### 🅰️ Control (A)
- **Headline**: "Build your debt payoff plan in 2 minutes"
- **Subheading**: "Join thousands using the debt snowball method to become debt-free faster."  
- **CTA**: "Sign up free with email"
- **Action**: `signup`

### 🅱️ Trial-Oriented (B)  
- **Headline**: "Start your debt-free journey — free for 7 days"
- **Subheading**: "Join others using the snowball method with real APR math."
- **CTA**: "Start free trial with email"
- **Action**: `trial`

### 🅲 Emotional Appeal (C)
- **Headline**: "Take control of your debt — try it free for 7 days"  
- **Subheading**: "Build a realistic plan. UK-focused. No-nonsense. No judgment."
- **CTA**: "Try it free — no card needed"
- **Action**: `trial`

## 📈 Success Metrics

### Primary Events (PostHog)
- `trial_started` - User completes trial signup
- `signup_success` - User completes account creation

### Tracking Events
- `experiment_variant_displayed` - Variant shown to user
- `signup_clicked` - Primary CTA clicked  
- `trial_clicked` - Trial CTA clicked
- `demo_clicked` - Demo CTA clicked

## 🔧 Technical Implementation

### Files Modified
- `src/hooks/useABVariant.js` - A/B test hook with sticky assignment
- `src/pages/Landing.jsx` - Hero section with dynamic variants

### Key Features
- **Sticky assignment**: Users see same variant on return visits
- **localStorage persistence**: `ab_test_hero_cta` key
- **Automatic tracking**: PostHog events fired on display + interaction
- **Debug helpers**: `window.forceABVariant()`, `window.resetABVariant()`

### Sample Analytics Data
```javascript
// When variant is displayed
experiment_variant_displayed: {
  test_name: 'hero_cta',
  variant: 'B',
  variant_name: 'Trial-Oriented',
  timestamp: '2025-01-15T...'
}

// When CTA is clicked  
trial_clicked: {
  test_name: 'hero_cta',
  variant: 'B', 
  variant_name: 'Trial-Oriented',
  cta_text: 'Start free trial with email',
  cta_action: 'trial',
  location: 'hero_primary_cta',
  headline: 'Start your debt-free journey — free for 7 days'
}
```

## 🛠️ Admin Commands (Dev Console)

```javascript
// Force a specific variant
window.forceABVariant('hero_cta', 'B')

// Reset assignment (get new random variant)  
window.resetABVariant('hero_cta')

// Check current variant
const hook = useABVariant('hero_cta')
console.log(hook.getDebugInfo())
```

## 📝 Running the Test

1. **Deployment**: ✅ Live on https://trysnowball.co.uk
2. **Assignment**: Random 33% split across A/B/C
3. **Duration**: Run for 2-4 weeks minimum
4. **Sample size**: Aim for 100+ conversions per variant
5. **Significance**: Use 95% confidence level

## 🎯 Next Steps

1. Monitor PostHog events for 1-2 weeks
2. Analyze conversion rates by variant
3. Declare winning variant
4. Remove losing variants and make winner permanent
5. Consider testing upgrade page copy next

## 📊 Expected Results

**Hypothesis**: Trial-focused variants (B/C) will convert better than generic signup (A) because:
- Trial removes friction/commitment  
- "Free for 7 days" adds urgency
- UK-focused copy builds trust

**Success criteria**: 
- Statistical significance (p < 0.05)
- >20% improvement in conversion rate
- Positive impact on downstream metrics (trial → paid conversion)