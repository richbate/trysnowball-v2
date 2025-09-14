# Guard-Rail PR Workflow

## Roles
- Claude: feature branches only; runs local checks; opens PRs with template
- Rich: required approver; merges to main
- ChatGPT: reviewer/designer; sets guardrails; flags risk

## Process
1) Task defined → branch name, acceptance criteria, no-bypass rules
2) Claude implements → runs `lint`, `test`, `snap:check`, `build` locally
3) Open PR with template + results
4) Rich reviews → merge to main if CI green
5) Deploy via Cloudflare Pages; run 3-step smoke (Home, Add Debt modal, Demo data)

## Guardrails
- No pushes to main
- No `--no-verify`
- No force-push to main
- CI checks required: `ci`, `visual-snapshots`
- CODEOWNERS enforced