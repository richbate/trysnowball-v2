# 📚 Safe Code Examples

**Copy-safe snippets for common TrySnowball patterns**

⚠️ **Do NOT access `.data` on any manager.** Always use the async facade (e.g., `debtsManager.getData()` / `getMetrics()`). Direct `.data` access will crash in production and is blocked by ESLint, dev proxy guard, and CI.

## 🎯 Quick Navigation

- **[Reading Debts + Metrics](#1-reading-debts--metrics)** - Get debt data safely
- **[Loading Demo Data](#2-loading-demo-data)** - UI controls refresh timing  
- **[Settings Management](#3-settings-management)** - Theme, currency, preferences

---

## 1. 📊 Reading Debts + Metrics

### **React Component Pattern**

```javascript
import React from 'react';
import { useDebts } from '@/hooks/useDebts';
import { formatCurrency } from '@/utils/format';

const DebtSummary = () => {
  const { debts, metrics, loading, error } = useDebts();
  
  if (loading) return <div>Loading your debts...</div>;
  if (error) return <div>Error loading debts: {error.message}</div>;
  
  return (
    <div>
      <h2>Your Debt Summary</h2>
      <p>Total Debt: {formatCurrency(metrics.totalDebt)}</p>
      <p>Monthly Minimums: {formatCurrency(metrics.totalMinPayments)}</p>
      <p>Number of Debts: {metrics.count}</p>
      
      <ul>
        {debts.map(debt => (
          <li key={debt.id}>
            {debt.name}: {formatCurrency(debt.balance)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DebtSummary;
```

### **Direct Manager Usage (Advanced)**

```javascript
import { debtsManager } from '@/lib/debtsManager';
import { formatCurrency } from '@/utils/format';

const analyzeUserDebts = async () => {
  try {
    // ✅ Safe data access via facade
    const { debts } = await debtsManager.getData();
    const metrics = await debtsManager.getMetrics();
    
    // Process the data
    const totalBalance = metrics.totalDebt;
    const largestDebt = debts.reduce((max, debt) => 
      debt.balance > max.balance ? debt : max
    );
    
    console.log(`Total debt: ${formatCurrency(totalBalance)}`);
    console.log(`Largest debt: ${largestDebt.name}`);
    
    return { totalBalance, largestDebt };
    
  } catch (error) {
    console.error('Failed to analyze debts:', error);
    throw error;
  }
};

// Usage
const analysis = await analyzeUserDebts();
```

### **❌ What NOT to Do**

```javascript
// 🚫 NEVER ACCESS .data DIRECTLY (crashes in production)
const debts = debtsManager.data.debts;         // ❌ Will crash
const total = debtsManager.data.metrics.total; // ❌ Will crash

// 🚫 NEVER USE SYNCHRONOUS PATTERNS 
const debts = getDebtsSync();  // ❌ Doesn't exist, causes errors
setDebts(debts);              // ❌ No error handling
```

---

## 2. 🎬 Loading Demo Data

### **UI Component with Demo Loading**

```javascript
import React, { useState } from 'react';
import { useDebts } from '@/hooks/useDebts';

const DemoDataLoader = () => {
  const { debts, loadDemoData, clearAllData, refresh } = useDebts();
  const [loading, setLoading] = useState(false);

  const handleLoadDemo = async (locale = 'uk') => {
    setLoading(true);
    try {
      await loadDemoData(locale);
      await refresh(); // UI controls refresh timing
      console.log('Demo data loaded successfully');
    } catch (error) {
      console.error('Failed to load demo data:', error);
      alert('Failed to load demo data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    setLoading(true);
    try {
      await clearAllData();
      await refresh();
      console.log('All data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Demo Controls</h3>
      
      {debts.length === 0 ? (
        <div>
          <p>No debts yet. Try loading some demo data:</p>
          <button 
            onClick={() => handleLoadDemo('uk')} 
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load UK Demo Data'}
          </button>
          <button 
            onClick={() => handleLoadDemo('us')} 
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load US Demo Data'}
          </button>
        </div>
      ) : (
        <div>
          <p>{debts.length} debts loaded</p>
          <button 
            onClick={handleClearData} 
            disabled={loading}
          >
            {loading ? 'Clearing...' : 'Clear All Data'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DemoDataLoader;
```

### **Demo Data in Onboarding Flow**

```javascript
import { useDebts } from '@/hooks/useDebts';

const OnboardingFlow = () => {
  const { loadDemoData, refresh } = useDebts();
  const [step, setStep] = useState('welcome');

  const startWithDemo = async () => {
    try {
      setStep('loading');
      await loadDemoData('uk'); // Load realistic UK examples
      await refresh();
      setStep('demo-loaded');
    } catch (error) {
      console.error('Demo loading failed:', error);
      setStep('error');
    }
  };

  if (step === 'loading') return <div>Loading demo data...</div>;
  if (step === 'demo-loaded') return <div>Demo data ready! Explore your debt payoff plan.</div>;
  
  return (
    <div>
      <h2>Welcome to TrySnowball</h2>
      <p>See how the debt snowball method works:</p>
      <button onClick={startWithDemo}>
        Try with Demo Data
      </button>
    </div>
  );
};
```

### **❌ What NOT to Do**

```javascript
// 🚫 NEVER CREATE INLINE DEMO ARRAYS
const demoDebts = [
  { name: 'Credit Card', balance: 1000 }, // ❌ Use generateDemoDebts() instead
];
await debtsManager.saveDebts(demoDebts); // ❌ Not the correct method

// 🚫 NEVER SKIP REFRESH AFTER LOADING
await loadDemoData('uk');
// Missing: await refresh(); ❌ UI won't update
```

---

## 3. ⚙️ Settings Management

### **Theme and Currency Component**

```javascript
import React from 'react';
import { useSettings } from '@/hooks/useSettings';

const SettingsPanel = () => {
  const { settings, updateSettings, loading } = useSettings();

  const handleThemeChange = async (newTheme) => {
    try {
      await updateSettings({ theme: newTheme });
      console.log('Theme updated to:', newTheme);
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  const handleCurrencyChange = async (newCurrency) => {
    try {
      await updateSettings({ 
        currency: newCurrency,
        locale: newCurrency === 'GBP' ? 'en-GB' : 'en-US'
      });
      console.log('Currency updated to:', newCurrency);
    } catch (error) {
      console.error('Failed to update currency:', error);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div>
      <h3>Preferences</h3>
      
      <div>
        <label>Theme:</label>
        <select 
          value={settings.theme || 'light'}
          onChange={(e) => handleThemeChange(e.target.value)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </div>

      <div>
        <label>Currency:</label>
        <select
          value={settings.currency || 'GBP'}
          onChange={(e) => handleCurrencyChange(e.target.value)}
        >
          <option value="GBP">British Pound (£)</option>
          <option value="USD">US Dollar ($)</option>
          <option value="EUR">Euro (€)</option>
        </select>
      </div>

      <div>
        <p>Pro Status: {settings.subscription?.status || 'Free'}</p>
      </div>
    </div>
  );
};

export default SettingsPanel;
```

### **Pro Access Check**

```javascript
import { useSettings } from '@/hooks/useSettings';

const ProFeatureGate = ({ children, fallback }) => {
  const { settings, loading } = useSettings();
  
  if (loading) return <div>Checking access...</div>;
  
  const isPro = settings?.subscription?.status === 'active';
  
  return isPro ? children : (fallback || <div>Pro feature - upgrade to access</div>);
};

// Usage
const AdvancedAnalytics = () => (
  <ProFeatureGate fallback={<UpgradePrompt />}>
    <div>Advanced Pro analytics here...</div>
  </ProFeatureGate>
);
```

### **Safe Currency Formatting**

```javascript
import { formatCurrency } from '@/utils/format';
import { useSettings } from '@/hooks/useSettings';

const CurrencyDisplay = ({ amount }) => {
  const { settings } = useSettings();
  
  // ✅ Safe formatting with settings
  return (
    <span className="currency">
      {formatCurrency(amount, settings)}
    </span>
  );
};

// Usage in calculations
const DebtSummary = () => {
  const { metrics } = useDebts();
  const { settings } = useSettings();
  
  return (
    <div>
      <h3>Total Debt: {formatCurrency(metrics.totalDebt, settings)}</h3>
      <p>Monthly Minimums: {formatCurrency(metrics.totalMinPayments, settings)}</p>
    </div>
  );
};
```

### **❌ What NOT to Do**

```javascript
// 🚫 NEVER USE LOCALSTORAGE DIRECTLY FOR SETTINGS
const theme = localStorage.getItem('trysnowball-theme'); // ❌ Use useSettings()
localStorage.setItem('currency', 'GBP');                // ❌ Use updateSettings()

// 🚫 NEVER USE HARDCODED FORMATTERS
const formatted = new Intl.NumberFormat('en-GB').format(amount); // ❌ Use formatCurrency()

// 🚫 NEVER ACCESS SETTINGS SYNCHRONOUSLY
const currency = getSettingsSync().currency; // ❌ Settings are async
```

---

## 🎯 Key Principles

### **Always Follow These Patterns:**

1. **Use React hooks** - `useDebts()`, `useSettings()` for state management
2. **Async operations** - All data operations use `await` with error handling
3. **Loading states** - Show loading indicators during async operations
4. **Error handling** - Wrap operations in try/catch blocks
5. **UI refresh control** - Call `refresh()` after data changes

### **Never Do These:**

1. **Direct `.data` access** - Will crash in production
2. **localStorage for app data** - Use hooks instead
3. **Synchronous assumptions** - All data operations are async
4. **Inline demo arrays** - Use `generateDemoDebts()` function
5. **Hardcoded formatters** - Use `formatCurrency()` with settings

---

**Copy these examples directly into your components** - they follow all safety patterns and will work reliably in production. Each example includes proper error handling, loading states, and follows the CP-1 architecture principles.