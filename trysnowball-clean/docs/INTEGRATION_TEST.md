# Linear-GitHub Integration Test

**Purpose**: This file demonstrates the Linear-GitHub integration setup for TrySnowball.

## Test Scenario

This commit should:
1. ✅ Link to TRY-5 Linear issue
2. ✅ Update issue status to "In Progress" (if integration is active)
3. ✅ Show commit reference in Linear issue timeline
4. ✅ Close TRY-5 when commit is merged (using `fixes #TRY-5`)

## Integration Features Demonstrated

- **Commit Linking**: Magic word `fixes #TRY-5` in commit message
- **Documentation Sync**: Changes to `/docs/` folder trigger Linear notifications
- **Status Automation**: Issue status updates based on commit/PR activity
- **Timeline Visibility**: GitHub activity appears in Linear issue history

## Next Steps After Integration is Live

1. Repository owner completes GitHub app installation
2. Configure branch format and workflow automation
3. Test with sample PR using suggested branch naming
4. Verify bi-directional sync functionality

## Test Results

*To be updated after integration is configured:*

- [ ] Commit appeared in TRY-5 timeline
- [ ] Issue status updated correctly
- [ ] Documentation link accessible from Linear
- [ ] Merge operation closes issue automatically

---

**Note**: This test file was created as part of TRY-5 implementation and will serve as a validation checkpoint once the Linear GitHub app is installed and configured by the repository administrator.