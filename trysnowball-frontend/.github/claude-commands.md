# Claude Code Commands

Use these commands in GitHub issues and PRs to trigger Claude Code:

## Available Commands

### Code Implementation
- `@claude implement [feature description]` - Implement a new feature
- `@claude fix [bug description]` - Fix a bug
- `@claude refactor [code area]` - Refactor existing code
- `@claude test [component/function]` - Add tests

### Code Review
- `/review` - Review the current PR
- `/security` - Security-focused review
- `/performance` - Performance analysis
- `/accessibility` - Check accessibility issues

### Documentation
- `@claude document [file/function]` - Add documentation
- `@claude update-readme` - Update README with recent changes
- `@claude changelog` - Generate changelog entry

### Specific Tasks
- `@claude add-debt-feature [description]` - Add debt management feature
- `@claude improve-ux [area]` - Improve user experience
- `@claude optimize [component]` - Optimize performance
- `@claude fix-types` - Fix TypeScript errors

## Examples

```
@claude implement a feature to export debts as CSV
```

```
@claude fix the authentication error when users log in with magic links
```

```
/review - please check for React hooks issues
```

## Guidelines

1. Be specific in your requests
2. Claude will create a PR with the changes
3. Always review Claude's changes before merging
4. Use `/review` on PRs for code review
5. Claude follows the project's CLAUDE.md guidelines

## Notes

- Claude has access to the entire codebase
- Changes are made in a new branch
- Tests are run automatically after changes
- Build verification happens before PR creation