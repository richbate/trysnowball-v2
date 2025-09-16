## Complete Phase 3: Architecture Hardening + Documentation

### Changes
- debtsManager → pure facade over localDebtStore (no local state/legacy storage)
- Upgrade routing unified; Beta removed (Free vs Pro only)  
- Dev-only storage guard (blocks prod misuse)
- E2E smoke tests for critical flows (debts lifecycle, upgrade visibility)
- No-legacy CI checker script added
- **ARCHITECTURE.md** added documenting the hardened architecture

### Acceptance Criteria
✅ `/my-plan/debts` lifecycle stable (demo ↔ clear)
✅ `/upgrade` shows real pricing; no "temporarily unavailable"  
✅ No references to betaEnabled / UpgradeLifetime / trysnowball-user-data
✅ `npm run check:no-legacy` identifies legacy patterns
✅ Architecture documented for future maintainers

### Files
- 🗑️ Removed 4 legacy files (3,013 lines)
- ✨ Added E2E tests, CI workflow, architecture docs
- ♻️ Refactored debtsManager to pure facade pattern

### Testing
- [x] Dev server compiles without errors
- [x] Debts tab: demo load → edit → clear → reload works
- [x] Upgrade page shows pricing correctly
- [x] No console errors (Router v7 warnings expected)
- [x] `npm run check:no-legacy` correctly identifies patterns

### Post-Merge Checklist
- [ ] Verify `/my-plan/debts` full lifecycle in production
- [ ] Confirm `/upgrade` shows real pricing
- [ ] Test Free vs Pro gating works correctly

🤖 Generated with [Claude Code](https://claude.ai/code)
