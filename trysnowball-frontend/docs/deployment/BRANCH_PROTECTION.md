# Branch Protection & Release Guidelines

## GitHub Branch Protection Rules

Configure these settings in GitHub → Settings → Branches → Add rule for `main`:

### Required Settings
- ✅ **Require pull request reviews before merging**
  - Required number of reviews: 1
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners (optional)

- ✅ **Require status checks to pass before merging**  
  - ✅ Require branches to be up to date before merging
  - Required status checks:
    - `test-and-build (18)` 
    - `test-and-build (20)`

- ✅ **Require conversation resolution before merging**
- ✅ **Include administrators** (enforce rules for all)
- ✅ **Allow force pushes** (disabled)
- ✅ **Allow deletions** (disabled)

### Optional Settings
- ✅ **Restrict pushes that create files** (optional - for security)
- ✅ **Require signed commits** (optional - for compliance)

## Release Tagging

### First Launch Release
```bash
# After successful main branch merge
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Initial production release

- Local-first IndexedDB storage
- Magic-link authentication  
- Debt snowball calculator
- AI debt coach
- Screenshot automation
- Production hardening complete"

git push origin v1.0.0
```

### Subsequent Releases
```bash
# Feature releases
git tag -a v1.1.0 -m "Add new feature: XYZ"

# Bug fixes  
git tag -a v1.0.1 -m "Fix: resolve issue with XYZ"

# Major changes
git tag -a v2.0.0 -m "Breaking: migrate to new architecture"

git push origin <tag-name>
```

## Release Workflow

### 1. Feature Development
- Create feature branch from `main`
- Develop and test locally
- Open PR when ready
- Address review feedback
- Merge after CI passes + approval

### 2. Pre-Release Checklist
- [ ] All tests pass (`npm run test:all`)
- [ ] Build succeeds (`npm run build`)  
- [ ] Linting clean (`npm run lint:strict`)
- [ ] Screenshot tests updated if UI changed
- [ ] CHANGELOG.md updated with changes
- [ ] Version bumped in package.json if needed

### 3. Production Deploy
- [ ] Merge PR to main
- [ ] Verify CI passes on main
- [ ] Tag release (`git tag -a vX.Y.Z`)
- [ ] Monitor deployment health
- [ ] Check `/health` endpoint responds
- [ ] Smoke test critical user paths

## Rollback Plan

### Quick Rollback (Minutes)
```bash
# Revert to previous working tag
git checkout v1.0.0
git tag -a v1.0.1-rollback -m "Emergency rollback from v1.0.1"
git push origin v1.0.1-rollback

# Then deploy the rollback tag
```

### Clean Rollback (Hours)  
```bash
# Create revert PR
git revert <bad-commit-hash>
git checkout -b fix/rollback-v1.0.1
git push origin fix/rollback-v1.0.1

# Open PR, review, merge normally
```

## Monitoring

### Health Checks
- **Worker**: `https://trysnowball.co.uk/health`
- **Frontend**: Check homepage loads
- **Analytics**: Verify events flowing to PostHog
- **Auth**: Test magic link flow

### Success Metrics
- CI build time < 10 minutes
- Test completion < 2 minutes
- Zero critical alerts
- Auth success rate > 99%

## Emergency Contacts

### Critical Issues
1. **Check health endpoint** first
2. **Review recent commits** in main
3. **Check CI status** in GitHub Actions  
4. **Monitor user reports** if available
5. **Execute rollback** if needed

### Communication
- **Internal**: Update team on status
- **External**: Status page if user-facing
- **Post-mortem**: Document learnings

---

*This process ensures stable releases while maintaining development velocity.*