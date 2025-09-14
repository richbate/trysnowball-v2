# GitHub Actions & Claude Code Setup

This repository uses Claude Code for automated development assistance through GitHub Actions.

## Setup Instructions

### 1. Install Claude GitHub App
Visit [Claude Code GitHub App](https://github.com/apps/claude-code) and install it on this repository.

### 2. Add API Key
Add your Anthropic API key as a repository secret:

1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `ANTHROPIC_API_KEY`
4. Value: Your API key from [Anthropic Console](https://console.anthropic.com)

### 3. Enable Actions
Ensure GitHub Actions are enabled for this repository in Settings → Actions → General.

## Usage

### In Issues
Create an issue and comment:
```
@claude implement dark mode toggle in settings
```

### In Pull Requests
Request a review:
```
/review
```

### Quick Commands
- `@claude fix [bug]` - Fix a bug
- `@claude test [component]` - Add tests
- `@claude document` - Add documentation
- `/review` - Review PR
- `/security` - Security audit

## Workflow Files

- `.github/workflows/claude-code.yml` - Main Claude Code workflow
- `.github/claude-commands.md` - Available commands documentation
- `CLAUDE.md` - Project context and guidelines for Claude

## Security Notes

- Never commit API keys
- Claude's changes create PRs (not direct commits)
- Always review before merging
- Sensitive operations require approval

## Troubleshooting

### Claude not responding
- Check API key is set correctly
- Verify GitHub App is installed
- Check Actions tab for errors

### Tests failing after Claude's changes
- Claude runs tests automatically
- Check the Actions log for details
- You can re-run with `@claude fix test failures`

## Best Practices

1. Be specific in requests
2. Review all PRs before merging
3. Use `/review` for code quality checks
4. Keep CLAUDE.md updated with project context
5. Use branch protection rules

## Support

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code/github-actions)
- [Report Issues](https://github.com/anthropics/claude-code/issues)