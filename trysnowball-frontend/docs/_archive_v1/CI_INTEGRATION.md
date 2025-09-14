# 🚀 CI/CD Integration Guide

The evaluation framework is fully integrated into CI/CD pipelines to prevent regressions and ensure code quality.

## 📋 CI Workflows

### 1. Pull Request Evaluation
**File**: `.github/workflows/evaluation.yml`

**Trigger**: Every PR to `main` or `develop`

**What it does**:
- ⚡ Runs `npm run evaluate:ci` (fail-fast pipeline)  
- 📊 Generates evaluation summary
- 💬 Posts results as PR comment
- ❌ Blocks merge if critical tests fail
- ⏱️ Completes in ~2 minutes

**Components tested**:
- ✅ ESLint (code quality)
- ✅ Contract tests (feature invariants) 
- ✅ Property tests (math correctness)
- ✅ Config tests (environment safety)
- ✅ Build validation (deployment readiness)
- ✅ Golden master tests (output consistency)

### 2. Nightly Full Evaluation
**File**: `.github/workflows/nightly-evaluation.yml`

**Trigger**: 2 AM UTC daily + manual dispatch

**What it does**:
- 🌙 Runs complete `npm run evaluate` suite
- 📊 Generates comprehensive reports
- 🚨 Creates GitHub issues on failure
- ✅ Auto-closes issues when fixed
- 📈 Tracks performance baselines

**Additional features**:
- Performance benchmarking
- Long-term trend analysis  
- Comprehensive artifact storage (30 days)
- Automatic issue management

## 🔧 Local Development Integration

### Pre-push Hooks
```bash
# Install lefthook for local git hooks
npx lefthook install

# Now git push automatically runs:
# - npm run evaluate:quick (prevents noisy PRs)
# - lint-staged (code formatting)
```

### Manual Commands
```bash
# Quick evaluation (same as PR CI)
npm run evaluate:ci

# Full evaluation (same as nightly)  
npm run evaluate

# Individual test suites
npm run test:contracts
npm run test:property
npm run test:config
npm run test:golden
npm run test:analytics
```

## 📊 CI Feedback

### PR Comments
Every PR gets an automated comment showing:
```markdown
## 🧪 Evaluation Results

✅ **Status**: All tests passed!

### Test Summary
- **Total**: 12 tests
- **Passed**: 12 (100%)

### Coverage Report
- ✅ **Lines**: 87% (target: 85%)
- ✅ **Functions**: 83% (target: 80%)  
- ✅ **Branches**: 75% (target: 70%)

🚀 **Status**: Ready to merge
```

### Issue Creation
Failed nightly evaluations automatically create issues:
- 🏷️ Labeled: `bug`, `nightly-evaluation-failure`, `high-priority`
- 📋 Contains: Failure details, workflow links, debugging steps
- ✅ Auto-closed when evaluation passes

## 🎯 Success Criteria

### PR Ready to Merge ✅
- All contract tests pass
- Property tests complete without errors
- ESLint shows no errors (warnings OK)
- Build completes successfully
- Coverage meets thresholds

### Deployment Blocked ❌
- Any contract test fails
- Property test finds edge case bugs
- Build fails
- Critical configuration errors
- Major coverage regression

## 📈 Monitoring & Alerts

### GitHub Notifications
- Failed nightly evaluations → GitHub issue
- PR evaluation failures → Blocks merge + comment
- Coverage regressions → Warning in PR comment

### Artifacts Available
- JUnit XML test results (7 days)  
- Coverage reports (7 days)
- Evaluation summaries (30 days)
- Performance baselines (90 days)

## 🛠️ Troubleshooting

### PR Evaluation Failed
1. Check PR comment for specific failures
2. Run `npm run evaluate:ci` locally
3. Fix issues and push again
4. Re-run CI if needed

### Nightly Evaluation Issues
1. Check GitHub issues for `nightly-evaluation-failure` label
2. Review workflow logs in Actions tab
3. Run `npm run evaluate` locally to reproduce
4. Fix issues and verify with `npm run evaluate:ci`

### Performance Regressions
1. Compare performance baselines in artifacts
2. Check for dependency updates or code changes
3. Profile with `npm run test:property -- --verbose`
4. Optimize and re-run evaluation

## 🔄 Continuous Improvement

The evaluation framework evolves with the codebase:
- New contract tests for new features
- Updated property tests for math changes
- Enhanced golden masters for UI changes  
- Performance baselines track improvements

**Key principle**: Never ship broken code, catch issues before they reach users.