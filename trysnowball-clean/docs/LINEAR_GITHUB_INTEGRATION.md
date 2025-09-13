# Linear-GitHub Integration Setup Guide

**Issue Reference**: TRY-5 - Set up Linear-GitHub integration for TrySnowball repo

## Overview

This guide provides step-by-step instructions for connecting the TrySnowball repository to Linear for seamless issue tracking, automated status updates, and development workflow integration.

## Benefits

- ✅ Commits with `fixes #TRY-123` automatically close Linear issues
- ✅ Pull requests link to Linear issues automatically
- ✅ Two-way synchronization of comments, status, and assignees
- ✅ Documentation changes trigger Linear notifications
- ✅ Claude Code can reference Linear issues directly
- ✅ Full visibility into development progress

## Prerequisites

- Linear workspace admin access
- GitHub repository admin access for TrySnowball
- Repository: `trysnowball-frontend` (or relevant repo name)

## Installation Steps

### 1. Enable Linear GitHub Integration

1. **Access Integration Settings**:
   - In Linear, navigate to `Settings > Integrations`
   - Find the GitHub integration option
   - Click to enable and configure

2. **Authenticate with GitHub**:
   - Go through the OAuth process to allow Linear access to GitHub
   - Select the TrySnowball repository when prompted
   - Grant necessary permissions for reading/writing issues and PRs

3. **Configure Branch Format**:
   - In the GitHub integration settings, go to "Branch format" section
   - Choose `identifier-title` format for consistent branch naming
   - Example: Issues will suggest branches like `try-123-payment-impact-feedback`

### 2. Configure Auto-Sync Rules

#### Commit Message Integration

Enable commit-triggered workflows:

**Magic Words for Closing Issues**:
- `close`, `closes`, `closed`, `closing`
- `fix`, `fixes`, `fixed`, `fixing`
- `resolve`, `resolves`, `resolved`, `resolving`
- `complete`, `completes`, `completed`, `completing`

**Magic Words for Linking (without closing)**:
- `ref`, `references`
- `part of`, `related to`
- `contributes to`, `towards`

**Example Commit Messages**:
```bash
# Closes the issue when merged to main branch
git commit -m "feat: implement payment impact feedback

fixes #TRY-9"

# Links without closing
git commit -m "docs: update API documentation

ref #TRY-15"
```

#### Pull Request Integration

**Automatic Linking Methods**:

1. **Branch Name Method**:
   - Create branches using Linear's suggested format
   - Branch names like `try-9-payment-impact-feedback` auto-link to TRY-9

2. **PR Title Method**:
   - Include issue ID in PR title: `TRY-9: Implement payment impact feedback`

3. **PR Description Method**:
   - Add magic words + issue ID in PR description
   - Example: `This PR closes TRY-9 and contributes to TRY-10`

### 3. Workflow Automation Setup

#### Status Transitions

Configure automatic status changes:

- **Branch Created**: Issue moves to `In Progress`
- **PR Opened**: Issue remains `In Progress`
- **PR Merged**: Issue moves to `Done`
- **PR Closed (unmerged)**: Issue returns to previous status

#### Team-Based Rules

1. **Enable Per-Team Automation**:
   - Go to team settings in Linear
   - Enable GitHub workflow automation
   - Configure status mapping for your team's workflow

2. **Personal Automation Settings**:
   - Enable auto-assignment of issues when branch is created
   - Auto-move issues to `In Progress` when working on them

### 4. Documentation Sync Configuration

#### Enable Repository Watching

1. **Configure Webhooks**:
   - Linear will set up webhooks automatically for watched repositories
   - Changes to `/docs/` folder will trigger notifications

2. **Documentation Linking**:
   - Reference docs in Linear issues: `/docs/CP-1_CLEAN_DEBT_MODEL.md`
   - Links will be accessible directly from Linear interface

#### File Change Notifications

Configure notifications for:
- New documentation files in `/docs/`
- Updates to existing specification files
- Changes to README and setup instructions

### 5. Testing the Integration

#### Test Commit with Issue Reference

1. **Create Test Branch**:
   ```bash
   git checkout -b try-5-github-integration-test
   ```

2. **Make Test Commit**:
   ```bash
   # Add this integration documentation
   git add docs/LINEAR_GITHUB_INTEGRATION.md
   git commit -m "docs: add Linear-GitHub integration setup guide

   This documentation provides complete setup instructions for connecting
   the TrySnowball repository to Linear for automated issue tracking.

   fixes #TRY-5"
   ```

3. **Create Test PR**:
   ```bash
   git push origin try-5-github-integration-test
   # Create PR via GitHub UI with title: "TRY-5: Linear-GitHub Integration Setup"
   ```

4. **Verify Integration**:
   - Check that TRY-5 status updates to `In Progress`
   - Verify PR appears linked in Linear issue
   - Confirm merge closes the Linear issue

## Usage Examples

### Daily Development Workflow

1. **Pick up Issue**:
   - Assign yourself to Linear issue (e.g., TRY-25)
   - Copy suggested branch name from Linear

2. **Create Branch**:
   ```bash
   git checkout -b try-25-user-onboarding-flow
   ```

3. **Develop & Commit**:
   ```bash
   git commit -m "feat: implement user onboarding modal

   - Add welcome flow for new users
   - Include tutorial tooltips
   - Integrate with existing auth system

   fixes #TRY-25"
   ```

4. **Create PR**:
   - Title: `TRY-25: Implement user onboarding flow`
   - Description includes `closes TRY-25`
   - Issue automatically links and updates status

5. **Merge & Complete**:
   - PR merge automatically closes TRY-25 in Linear
   - No manual status updates needed

### Multi-Issue Commits

```bash
git commit -m "refactor: consolidate debt calculation utilities

This refactoring improves performance and reduces code duplication
across the debt management system.

contributes to #TRY-15
fixes #TRY-18
ref #TRY-20"
```

### Documentation Updates

```bash
git commit -m "docs: update CP-4 forecast engine specification

- Add new calculation examples
- Clarify edge case handling
- Update API contract references

related to #TRY-12"
```

## Troubleshooting

### Common Issues

1. **Issue Not Linking**:
   - Verify magic word spelling (`fixes` not `fix`)
   - Check issue ID format (`#TRY-5` not `TRY-5`)
   - Ensure repository is connected in Linear settings

2. **Status Not Updating**:
   - Check workflow automation is enabled
   - Verify team settings for status transitions
   - Confirm branch naming follows configured format

3. **PR Not Showing in Linear**:
   - Check branch name includes issue identifier
   - Verify PR title or description contains issue reference
   - Ensure Linear GitHub app has repository permissions

### Integration Health Check

Verify integration is working:

1. **Repository Connection**:
   - Go to Linear Settings > Integrations > GitHub
   - Confirm TrySnowball repository is listed and active

2. **Webhook Status**:
   - Check webhook delivery status in GitHub repository settings
   - Verify Linear webhook URLs are responding

3. **Recent Activity**:
   - Review recent Linear issue updates
   - Check that GitHub activity appears in issue timeline

## Security Considerations

- Linear GitHub app requires minimal permissions for integration
- Only repository-level access needed, not organization-wide
- Webhooks use secure HTTPS endpoints
- Access can be revoked from either Linear or GitHub settings

## Support Resources

- **Linear Documentation**: https://linear.app/docs/github
- **GitHub Integration Settings**: Linear Settings > Integrations > GitHub
- **Repository Settings**: GitHub Repository > Settings > Webhooks
- **Issue Tracking**: Report integration issues to TRY-X Linear issues

## Acceptance Criteria Status

- ✅ **Linear GitHub App Configuration**: Documentation provided for installation
- ✅ **Auto-sync Rules**: Comprehensive magic word and branch format guide
- ✅ **Documentation Integration**: Setup instructions for `/docs/` folder sync
- ✅ **Testing Framework**: Complete test procedure with example commit
- ✅ **Bi-directional Sync**: Configuration for GitHub ↔ Linear status updates

## Next Steps

1. **Repository Owner**: Follow installation steps 1-3
2. **Team**: Review usage examples and workflow integration
3. **Test**: Execute testing procedure in step 5
4. **Rollout**: Begin using `fixes #TRY-X` in commit messages
5. **Monitor**: Verify integration health over first week of usage

---

**Integration Completion**: This documentation fulfills TRY-5 requirements for Linear-GitHub integration setup. The actual app installation requires repository admin privileges and should be completed by the repository owner following this guide.