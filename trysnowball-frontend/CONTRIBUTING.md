# Contributing to TrySnowball

## 🚨 Before You Start

**Critical**: Run these commands before making any changes:

```bash
npm run check:no-legacy  # Validates no forbidden patterns
npm test                 # Runs all tests  
npm run docs:verify      # Validates documentation (coming soon)
```

⚠️ **Do NOT access `.data` on any manager.** Always use the async facade (e.g., `debtsManager.getData()` / `getMetrics()`). Direct `.data` access will crash in production and is blocked by ESLint, dev proxy guard, and CI.

## 📋 Do/Don't Quick Reference

| ✅ **DO** | ❌ **DON'T** |
|-----------|--------------|
| `const { debts, metrics } = useDebts();` | `const debts = debtsManager.data.debts;` |
| `const data = await debtsManager.getData();` | `const data = debtsManager.data;` |
| `const { settings } = useSettings();` | `localStorage.getItem('trysnowball-theme');` |
| `await loadDemoData('uk'); refresh();` | Inline demo arrays in components |
| `const isPro = settings?.subscription?.status === 'active';` | `const isPro = useBetaGate();` |
| `formatCurrency(amount, settings);` | `Intl.NumberFormat('en-GB')` |

## 🏗️ Architecture Guidelines

### Data Layer (CP-1)
- **debtsManager**: Pure facade over IndexedDB
- **No localStorage** for debts, analytics, or theme
- **All operations async**: Use `await` with facade methods

### Safe Patterns
```javascript
// ✅ Reading data
const { debts, metrics, loading, error } = useDebts();

// ✅ Loading demo data  
const { loadDemoData, refresh } = useDebts();
await loadDemoData('uk');
refresh(); // UI controls refresh timing

// ✅ Settings management
const { settings, updateSettings } = useSettings();
await updateSettings({ theme: 'dark' });

// ✅ Currency formatting
import { formatCurrency } from '@/utils/format';  
formatCurrency(metrics.totalDebt, settings);
```

## 🧪 Adding Demo Data

**Always use the single source of truth:**

```javascript
// ✅ Correct way
import { generateDemoDebts } from '@/utils/demoSeed';
const demoDebts = generateDemoDebts('uk'); // or 'us'
await debtsManager.loadDemoData('uk');

// ❌ Never do this
const demoDebts = [
  { name: 'Credit Card', balance: 1000, ... }, // Inline arrays
];
```

## 🛡️ Guardrails Active

1. **ESLint Rule**: Catches `.data` access during development
2. **Runtime Guard**: Throws clear errors on `.data` access in dev  
3. **CI Check**: Blocks deployment if forbidden patterns found
4. **Unit Tests**: Verify guardrails work correctly

## 📝 Pull Request Checklist

Before submitting a PR, ensure:

- [ ] **No `.data` access** - Use `getData()` / `getMetrics()` facade methods
- [ ] **No localStorage** for debts/settings - Use `useDebts()` / `useSettings()` hooks
- [ ] **Uses current patterns** - `useDebts()`, `useSettings()`, async facade methods
- [ ] **Documentation updated** if behavior changed (README, docs/)
- [ ] **Tests added/updated** for new functionality
- [ ] **CI passes** - All guardrails and tests pass
- [ ] **No beta references** - Use simple Free/Pro model
- [ ] **Safe demo data** - Uses `generateDemoDebts()` if adding demo functionality

## 🎯 Common Tasks

### Adding a New Feature
1. Use `useDebts()` / `useSettings()` hooks for state
2. All data operations via `await debtsManager.method()`
3. Add tests for new functionality
4. Update relevant documentation

### Modifying Data Layer
1. Changes go through `debtsManager` facade methods
2. Never modify `localDebtStore` directly from UI
3. UI controls refresh timing, data layer only persists
4. Add tests for data operations

### Styling/UI Changes  
1. Use existing design tokens and components
2. Mobile-first responsive design
3. Test on multiple screen sizes
4. Consider accessibility (colors, keyboard nav)

## 🚀 Development Setup

```bash
git clone <repo-url>
cd trysnowball-frontend
npm install
npm start  # Development server

# Before committing
npm run check:no-legacy
npm test
npm run build  # Verify production build
```

## 🆘 Getting Help

- **Architecture questions**: See `docs/ARCHITECTURE.md`
- **Data patterns**: See `docs/examples/` for safe code snippets
- **Authentication**: See `docs/auth/AUTH_DEBUG_GUIDE.md`
- **Crashes or errors**: Check that you're not accessing `.data` directly

## 🔧 Debugging

If you encounter crashes:

1. **Check for `.data` access** - This is the #1 cause of production crashes
2. **Use browser dev tools** - Check console for errors
3. **Verify async patterns** - Ensure proper `await` and error handling  
4. **Run guardrails** - `npm run check:no-legacy` to validate patterns

The guardrails are designed to prevent the production crashes that occurred from direct state access. Follow the safe patterns and the development experience will be smooth!

---

**Questions?** Open an issue or check the documentation in `docs/` - every pattern has safe examples.