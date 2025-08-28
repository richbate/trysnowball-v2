# 🎯 Marketing Consultant Onboarding Pack

**Welcome! This pack gets you up to speed on TrySnowball quickly and safely.**

⚠️ **Do NOT access `.data` on any manager.** Always use the async facade (e.g., `debtsManager.getData()` / `getMetrics()`). Direct `.data` access will crash in production and is blocked by ESLint, dev proxy guard, and CI.

## 📋 Essential Reading Order

### 1. 🌱 **User Flow & Product Understanding**
- **[User Journey Map](../DEBT_PAYOFF_ANALYSIS.md)** - How users progress from overwhelmed to debt-free
- **[Feature Summary](../FEATURE_SUMMARY.md)** - Complete feature overview with screenshots
- **[Business Model](#business-model)** - Free vs Pro tiers and positioning

### 2. 💬 **Messaging & Positioning**
- **[Value Propositions](#value-propositions)** - Core messaging framework
- **[Brand Voice](#brand-voice)** - Tone, style, and messaging guidelines
- **[FAQ Responses](#common-faqs)** - Ready-to-use responses for common questions

### 3. 🎨 **Brand Assets**
- **[Visual Identity](#visual-identity)** - Logo, colors, typography
- **[Screenshot Library](#screenshots)** - High-quality product screenshots
- **[Demo Instructions](#demo-flow)** - How to navigate the app for demos

---

## 🚀 Business Model

### **Free Tier**
- Basic debt tracking
- Snowball method calculations  
- Demo data exploration
- Basic payoff timeline

### **Pro Tier** (£9.99/month)
- Advanced analytics and insights
- AI debt coaching 
- Export functionality (CSV, PDF)
- Priority support
- Advanced "what-if" scenarios

### **Target Audience**
- **Primary**: UK residents with multiple debts (credit cards, loans, overdrafts)
- **Secondary**: Anyone wanting to understand debt payoff strategies
- **Pain Points**: Feeling overwhelmed, not knowing which debt to pay first, lack of clear progress tracking

---

## 💡 Value Propositions

### **Primary Messages**

#### 1. **"See your debt-free date"**
Transform anxiety into action with a clear, realistic timeline to debt freedom.

#### 2. **"Smart payoff strategy"** 
The debt snowball method - pay minimums on everything, attack smallest debt first for psychological wins.

#### 3. **"Track your progress"**
Visual progress tracking shows exactly how each payment moves you closer to debt freedom.

### **Supporting Benefits**
- **No complex budgeting required** - Works with your existing budget
- **Motivational milestones** - Celebrate debt elimination wins  
- **Free demo data** - Try it risk-free with realistic examples
- **UK-focused** - GBP currency, UK financial context

---

## 🎨 Visual Identity

### **Colors**
- **Primary**: Deep Blue (#1E40AF) - Trust, stability, financial security
- **Accent**: Green (#10B981) - Growth, progress, positive movement  
- **Warning**: Orange (#F59E0B) - Attention for important actions
- **Error**: Red (#EF4444) - Critical alerts and warnings

### **Typography**
- **Headers**: Clean, modern sans-serif (system fonts)
- **Body**: Readable, accessible text with good contrast
- **Numbers**: Clear, prominent display for debt amounts and dates

### **Visual Style**
- **Clean and minimal** - Reduces financial anxiety
- **Progress-focused** - Charts, timelines, visual milestones
- **Mobile-first** - Optimized for phone usage

---

## 📸 Screenshots

### **Getting Screenshots**
```bash
npm run screenshots        # Generate fresh screenshots
npm run screenshots:local  # Generate from localhost:3000
```

**Key Screenshots Available:**
- **Home page** - Value proposition and CTA
- **Demo data loaded** - Full debt table with realistic UK examples
- **Payoff timeline** - Visual chart showing debt elimination progression  
- **Progress tracking** - Month-by-month breakdown
- **Mobile views** - Responsive design on phone screens

**Screenshot Tips:**
- Use demo data (realistic UK amounts: £1,200 credit card, £3,500 car loan, etc.)
- Show progress over time (not just starting state)
- Capture both desktop and mobile views

---

## 🎬 Demo Flow

### **Safe Demo Process** ⚠️

**IMPORTANT**: Always use demo data, never real user data for demos.

```javascript
// ✅ Safe demo loading  
const { loadDemoData, refresh } = useDebts();
await loadDemoData('uk');  // Loads realistic UK demo data
refresh();                 // Updates UI
```

### **Demo Script (5 minutes)**

#### 1. **Landing Page** (30 seconds)
- "TrySnowball helps UK residents get out of debt faster using the proven snowball method"
- Click "Try Demo Data" to load realistic examples

#### 2. **Demo Data Overview** (90 seconds)  
- Show loaded debts: Credit card (£1,200), Car loan (£3,500), Personal loan (£8,000)
- Explain: "Pay minimums on everything, throw extra money at the smallest debt"
- Point out debt-free date: "You could be debt-free by [calculated date]"

#### 3. **Timeline View** (60 seconds)
- Switch to Timeline tab
- Show month-by-month breakdown  
- Highlight: "Watch debts disappear one by one, smallest first"

#### 4. **What-If Scenarios** (90 seconds)
- Show extra payment slider: "What if you found an extra £50/month?"
- Watch debt-free date move closer
- Demonstrate motivational aspect

#### 5. **Call to Action** (30 seconds)
- "Start with your real debts or continue exploring with demo data"
- Mention Pro features for advanced users

### **Demo Data Details**
- **Credit Card**: £1,200 @ 21.9% APR, £50 minimum
- **Car Loan**: £3,500 @ 8.9% APR, £180 minimum
- **Personal Loan**: £8,000 @ 12.4% APR, £240 minimum
- **Total**: £12,700 debt, £470 total minimums

---

## ❓ Common FAQs

### **"Is this just another budgeting app?"**
No - TrySnowball focuses specifically on debt elimination strategy. You don't need to track every expense, just input your debts and see your payoff plan.

### **"Why pay smallest debt first instead of highest interest?"**
The snowball method prioritizes psychological wins. Eliminating a debt completely feels amazing and keeps you motivated. For many people, this emotional boost leads to better long-term success than the mathematically optimal avalanche method.

### **"Is my data secure?"**
Absolutely. Your debt information is stored locally on your device using IndexedDB. We don't send your personal financial data to our servers.

### **"What's the difference between Free and Pro?"**
Free gives you everything needed for basic debt elimination planning. Pro adds advanced analytics, AI coaching, export functionality, and priority support for £9.99/month.

### **"Can I use this for US debts?"**
While designed for UK users, the debt snowball method works anywhere. You can manually enter any currency - just select the US demo data to see dollar examples.

### **"How accurate are the calculations?"**
Very accurate. We use compound interest calculations with the exact same formulas your lenders use. The projections assume you make payments on time and don't add new debt.

---

## 🛠️ Technical Notes for Demos

### **Safe Patterns for Demo Setup**
```javascript
// ✅ Always use these patterns in demos
const { debts, metrics, loading } = useDebts();
const { settings } = useSettings();

// ❌ Never access these during demos  
// debtsManager.data.debts  // Will crash
// localStorage.getItem()   // Use hooks instead
```

### **Demo Data Reset**
```javascript
// Clear demo data if needed
const { clearAllData, refresh } = useDebts();
await clearAllData();
await refresh();
```

### **Common Demo Issues**
- **Empty state**: Always load demo data first
- **Loading states**: Wait for data to fully load before screenshoting
- **Mobile responsive**: Test on actual mobile device for screenshots

---

This onboarding pack gives you everything needed to represent TrySnowball effectively while following safe technical practices. The demo data and messaging framework ensure consistent, compelling presentations that highlight the product's value without technical risks.