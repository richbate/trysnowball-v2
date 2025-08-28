# Production Safety Nets

Automated guardrails to prevent regressions and catch operational failures before users do.

## 🛡️ Overview

Four safety nets run automatically in CI/CD:

1. **Seed Data Guardrail** - Prevents demo data leaks in production builds
2. **Uptime Monitor** - Detects downtime within 5 minutes
3. **Auth Canary Test** - Verifies auth endpoints after deploy
4. **Bundle Size Budget** - Prevents accidental bundle bloat

All checks add <1 minute to CI runtime and require zero manual intervention.

## 🔍 Safety Net Details

### 1. Seed Data Guardrail

**What it does**: Scans production builds for demo/test data patterns
**When it runs**: After every build in CI
**Failure condition**: Demo data detected in build artifacts

**Patterns detected**:
- `£43,905` (demo total debt)
- `demo@` / `demo123` (test emails/IDs)
- `PayPal.*£1,200` (hardcoded demo debts)
- `Barclaycard.*£8,500`
- `Halifax.*£15,000`
- `MBNA.*£18,812`

**Example failure**:
```bash
❌ DEMO DATA FOUND: '£43,905' detected in production build
🚫 Build contains demo data - failing CI to prevent production leak
```

### 2. Uptime Monitor

**What it does**: Health checks every 5 minutes via GitHub Actions cron
**Endpoints checked**:
- `https://trysnowball.co.uk/` (frontend)
- `https://trysnowball.co.uk/health` (auth worker)
- `https://trysnowball.co.uk/library` (critical pages)

**Failure condition**: Any endpoint returns non-200 or health returns `ok != true`

**Manual trigger**: GitHub Actions → `Uptime Monitor` → Run workflow

### 3. Auth Canary Test

**What it does**: Validates auth endpoints respond with valid JSON after main branch deploys
**When it runs**: Only on `main` branch merges
**Test method**: Sends invalid token to `/api/user`, expects structured JSON error

**Example success**:
```bash
✅ Auth endpoint is responding with valid JSON
Response structure validated
```

### 4. Bundle Size Budget

**What it does**: Prevents JS bundle from exceeding 300KB gzipped per chunk
**When it runs**: After every build in CI
**Tool**: `gzip-size-cli` for accurate measurements

**Example output**:
```bash
📄 main.abc123.js: 245.7 kB (gzipped)
📄 chunk.def456.js: 89.3 kB (gzipped)
✅ All bundles within size budget
```

**Example failure**:
```bash
❌ BUNDLE TOO LARGE: main.abc123.js (315.2 kB) exceeds 300KB budget
💡 Consider code splitting, lazy loading, or removing unused dependencies
```

## 🚨 What to do when Safety Nets Fail

### Seed Data Guardrail Failed
```bash
# 1. Check what demo data leaked
grep -r "£43,905" build/

# 2. Find the source component/file
# 3. Replace hardcoded values with props/state
# 4. Rebuild and verify clean
```

### Uptime Monitor Failed
```bash
# 1. Check GitHub Actions for failure details
# 2. Verify site manually: https://trysnowball.co.uk/health
# 3. Check Cloudflare/DNS if site is completely down
# 4. Review recent deployments for breaking changes
```

### Auth Canary Failed
```bash
# 1. Test auth manually:
curl -H "Authorization: Bearer test" https://trysnowball.co.uk/api/user

# 2. Check Worker logs in Cloudflare dashboard
# 3. Verify CORS headers and endpoint routing
# 4. Test with valid JWT if available
```

### Bundle Size Budget Exceeded
```bash
# 1. Analyze bundle composition
npm run analyze

# 2. Look for new heavy dependencies in package.json
# 3. Consider lazy loading for large routes/components
# 4. Remove unused imports and dependencies
```

## ⚙️ Temporary Overrides

### Skip Bundle Size Check (Emergency)
```yaml
# In CI, set environment variable
env:
  SKIP_BUNDLE_CHECK: "true"
```

### Skip Demo Data Check
```bash
# Add to CI step
if [ "$SKIP_DEMO_CHECK" != "true" ]; then
  # ... existing check
fi
```

### Disable Uptime Monitoring
```bash
# In .github/workflows/uptime-check.yml
# Comment out the cron schedule:
# - cron: "*/5 * * * *"
```

## 📊 Monitoring & Alerts

### GitHub Actions Status
- **Location**: Actions tab in GitHub repo
- **Filters**: Filter by workflow name or branch
- **History**: 90-day retention of workflow runs

### Manual Health Checks
```bash
# Quick health verification
curl https://trysnowball.co.uk/health | jq '.'

# Frontend availability
curl -I https://trysnowball.co.uk/

# Auth endpoint structure
curl -H "Authorization: Bearer test" https://trysnowball.co.uk/api/user
```

### Integration Ideas
```bash
# Slack notifications (add to workflows)
- name: Notify Slack on Failure
  if: failure()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
    -d '{"text":"🚨 TrySnowball safety net failed: ${{ github.workflow }}"}'

# Status page integration
- name: Update Status Page
  if: failure()
  run: |
    curl -X POST ${{ secrets.STATUS_API }} \
    -d '{"component_id":"frontend","status":"major_outage"}'
```

## 🎯 Success Metrics

- **Zero production data leaks** since implementation
- **<5 minute downtime detection** (uptime monitor frequency)
- **<1 minute CI overhead** from all 4 safety nets combined
- **300KB bundle budget** maintained (or consciously exceeded)

## 🔧 Maintenance

### Monthly Review
- [ ] Verify uptime monitor still catches issues (test with deliberate failure)
- [ ] Update demo data patterns if new test data added
- [ ] Review bundle size trends and adjust budget if needed
- [ ] Test auth canary manually to ensure it catches real failures

### After Major Changes
- [ ] Verify safety nets still work after CRA upgrades
- [ ] Update patterns after auth system changes
- [ ] Adjust bundle budget after major dependency updates
- [ ] Test uptime monitor after domain/hosting changes

---

*These safety nets provide automated protection without developer friction. They fail fast, fail clearly, and prevent silent regressions from reaching production.*