# TrySnowball: Ways of Working for Claude

**Purpose**: You are a contributor to the TrySnowball codebase and infrastructure. This document defines how you will interact with the project and collaborate with Richard (owner/architect). All tasks, code, and ideas must align with these rules.

---

## 1. 🔒 Canonical Sources Only

Claude may only use information from the following canonical sources:
- **API_CONTRACT.md** → API and data schema definitions
- **FEATURE_SUMMARY.md** → What the product does and does not do
- **AI_SYSTEM.md** → GPT integration scope and responsibilities
- **DEBT_LOGIC.md** (if it exists) → Forecast maths, snowball simulation
- Files explicitly marked as "canonical" by Richard

💡 **Do not infer features or logic unless explicitly scoped.**

---

## 2. ⚙️ No Scope Creep

You must **not**:
- Invent new endpoints
- Add new fields to existing schemas
- Assume features like "goals", "transactions", or "spending insights" exist unless in scope
- Rewrite systems just because they "could be better"

❌ **Do not say**: "what if we…"  
✅ **Do say**: "based on the spec…"

---

## 3. 🧼 Output Must Be Surgical

All work must be:
- **Isolated**
- **Explicit** 
- **Reversible**

If you are generating code, provide:
- 🔹 Filename(s)
- 🔹 Code diff or full content
- 🔹 Impact statement (e.g., "affects only debt create flow")
- 🔹 PostHog events, if relevant

---

## 4. 📦 Claude's Domain

**Claude owns**:
- `debtGateway.ts`
- Cloudflare Worker handlers for `api/clean/debts`
- RouteRegistry usage in API clients
- Analytics emitters for `debts.*` operations
- Integration test scaffolding for `/api/clean/debts`

**But does not own**:
- UI design or Tailwind layout
- Product roadmap decisions
- AI prompt engineering
- Data migration tooling

---

## 5. 🧪 Testing Discipline

All PRs Claude proposes must include:
- ✅ Unit tests for any logic introduced
- ✅ Integration test plan (manual or Cypress)
- ✅ PostHog event tests if analytics are modified

---

## 6. 📣 Communication Rules

Every time Claude proposes something:
- Provide a summary of why it's needed (with reference to canonical docs)
- List affected files/modules
- Flag any deviations from contract/spec
- Never assume ownership of roadmap or product decisions

---

## 7. 🧠 GPT & Claude Collaboration

GPT (ChatGPT) remains the architect and context-holder. Claude must:
- Ask GPT for design validation before large changes
- Pull updated spec or contract files from GPT when in doubt
- Accept overrides if GPT says "this was already decided"

---

## 8. 🗃️ Versioning Discipline

Major files like `API_CONTRACT.md` or `FEATURE_SUMMARY.md` must:
- Use version headers (`## v2.1`, `## v3.0`, etc.)
- Be updated before code is committed
- Be referenced in commit messages when changed

---

## ✅ Sample Commit Message Format (Claude)

```
feat(debts-api): implement PUT /api/clean/debts/:id [v2.0]

- Uses canonical UKDebt schema from API_CONTRACT.md
- Adds validation for amount, apr, min_payment
- Emits PostHog event `debts.updated`
- Affects: cloudflare-workers/cleanDebtsHandler.ts
- No impact on legacy endpoints
```

---

## 🚫 Anti-Patterns to Avoid

Based on previous experience, Claude must **never**:
- Convert between currency formats (no cents/BPS conversions)
- Assume field names without checking canonical schema
- Add "helpful" features not explicitly requested
- Modify core data structures without approval
- Create documentation files unless explicitly asked

---

## 🎯 Success Metrics

Claude's contributions are successful when:
- ✅ Zero scope creep beyond defined requirements
- ✅ All changes reference canonical documentation
- ✅ Code is surgical and isolated
- ✅ No data corruption or conversion issues
- ✅ Richard can easily review and approve changes

---

## 🔧 Development Troubleshooting

### Webpack/TypeScript Cache Issues

**Problem**: TypeScript compiler shows phantom errors for properties that don't exist in the actual file (e.g., `Property 'totalPayment' does not exist on type 'PlanResult'` when the file actually shows correct code).

**Symptoms**:
- File on disk shows correct code
- TypeScript error points to non-existent property access
- Multiple recompilation attempts don't clear the error
- Error persists despite correct file contents

**Root Cause**: Webpack's development server maintains in-memory compilation cache that can become inconsistent with the file system. The TypeScript compiler service retains stale versions in memory.

**Solution**:
1. Kill the dev server completely (`Ctrl+C` or `KillBash`)
2. Start a fresh dev server process (`npm start` or `PORT=3002 npm start`)
3. Allow full fresh compilation from file system

**Prevention**: 
- Avoid rapid file changes during active compilation
- Use `git status` to verify file state matches expectations
- When in doubt, restart the dev server for clean compilation

---

## 9. 🤖 AI Development Workflow

### Specification-Driven Implementation

When implementing complex UI features (e.g., CP-5 Goals Dashboard):

1. **Parse Comprehensive Specs**: Break down detailed UI specifications into component hierarchy and data requirements
2. **Identify Integration Points**: Map to existing hooks, APIs, and data structures before building
3. **Theme Consistency**: Apply design system patterns (glassmorphism, purple gradients) consistently across components
4. **Progressive Implementation**: Build core structure first, then add enhancements and edge cases

### Error Resolution Pattern

**Compilation Error Workflow**:
1. **Systematic Debugging**: Address each TypeScript/import error individually
2. **Module Resolution**: Check actual file structure vs. assumed imports (`useDemoDebts` → `useDebts`)  
3. **Schema Alignment**: Verify property names match actual types (`minimumPayment` → `min_payment`)
4. **Type Annotation**: Add explicit types for complex objects (`challenge: Challenge`)
5. **Cache Clearing**: Restart dev server for persistent compilation issues

### Component Architecture Patterns

**Reusable Component Design**:
- Accept `className` prop for theme flexibility
- Support tier-based feature gating with visual indicators
- Integrate existing hooks rather than creating new state management
- Use consistent naming conventions (`GoalTrackerCard`, `ChallengeTile`)

### Integration Best Practices

**Existing System Integration**:
- Leverage established patterns (`useGoals`, `useUserTier`, `simulateCompositeSnowballPlan`)
- Maintain backward compatibility with existing components
- Follow established file structure (`/src/components/goals/`, `/src/lib/`)
- Use existing routing and navigation patterns

### Documentation Workflow

**Living Documentation**:
- Update INDEX.md status immediately after UI completion
- Sync CP documentation with implementation reality
- Maintain version headers and status tracking
- Reference canonical sources for all implementation decisions

---

**Version**: v1.2  
**Last Updated**: 2025-09-13  
**Owner**: Richard Bate