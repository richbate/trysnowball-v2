## 📋 Pull Request Checklist

**Please ensure your PR meets these safety requirements:**

### 🔒 Data Layer Safety
- [ ] **No `.data` access** - All manager usage via `getData()` / `getMetrics()` facade methods
- [ ] **No localStorage** for debts/settings - Uses `useDebts()` / `useSettings()` hooks only  
- [ ] **Proper async patterns** - All manager calls use `await` with error handling

### ✅ Current Architecture (CP-1)
- [ ] **Uses facade methods** - `debtsManager.getData()`, `debtsManager.getMetrics()`
- [ ] **Uses React hooks** - `useDebts()`, `useSettings()` for state management
- [ ] **IndexedDB only** - No localStorage for app data (debts, analytics, theme)
- [ ] **Free/Pro model** - No beta flags or legacy access patterns

### 🧪 Quality Assurance  
- [ ] **Tests pass** - `npm test` runs without errors
- [ ] **CI guardrails pass** - `npm run check:no-legacy` validates patterns
- [ ] **Build succeeds** - `npm run build` completes successfully
- [ ] **Added/updated tests** for new functionality

### 📚 Documentation
- [ ] **Updated docs** if behavior changed (README, docs/, inline comments)
- [ ] **Code examples** follow safe patterns shown in documentation
- [ ] **No dangerous patterns** in code comments or documentation

---

## 📝 Description

**What does this PR do?**

<!-- Describe the changes -->

**Why is this change needed?**

<!-- Link to issue, user need, or technical requirement -->

## 🧪 Testing

**How was this tested?**

<!-- Describe your testing approach -->

- [ ] Manual testing in development
- [ ] Unit tests added/updated  
- [ ] Integration tests if applicable
- [ ] Tested on multiple screen sizes (if UI changes)

## 🔄 Breaking Changes

**Are there any breaking changes?**

- [ ] No breaking changes
- [ ] Breaking changes (describe below)

<!-- If breaking changes, describe migration path -->

## 📊 Performance Impact

**Does this change affect performance?**

- [ ] No performance impact
- [ ] Performance improvement (describe below)
- [ ] Performance regression (justify below)

<!-- If performance impact, provide details -->

---

## ⚠️ Safety Reminder

**This PR follows the safety patterns that prevent production crashes:**

✅ **Safe patterns used:**
- `const { debts, metrics } = useDebts()`
- `const data = await debtsManager.getData()`  
- `const { settings } = useSettings()`

❌ **Dangerous patterns avoided:**
- ~~`debtsManager.data.debts`~~ (crashes in production)
- ~~`localStorage.getItem('debt-data')`~~ (use hooks instead)
- ~~`useBetaGate()`~~ (retired, use Free/Pro model)

---

**Ready to merge when:**
- [ ] All CI checks pass ✅
- [ ] Code review approved ✅  
- [ ] No merge conflicts ✅