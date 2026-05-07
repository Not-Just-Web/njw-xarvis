# Git Workflow and Release Policy

Purpose: keep development structured and releasable.

## Branching Rules
- Default branch: main
- Never commit features directly to main.
- Each feature or chunk uses its own branch.
- Branch naming format:
  - feature/phase-X-short-name
  - fix/short-name
  - docs/short-name

Examples:
- feature/phase-1-background-router
- feature/phase-3-session-resume
- fix/provider-routing-timeout

## PR Rules
- Open PR from feature branch to main.
- PR title should include one tag:
  - [phase-0], [phase-1], [phase-2], [phase-3], [phase-4], [phase-5], [phase-6], [phase-7], [infra], [docs], [fix]
- PR must pass PR Validation workflow.
- Do manual validation for extension behavior before merge.
- Update docs/PROGRESS.md in same PR.

## Merge Rules
- Prefer squash merge for clean history.
- Merge only after validation is green.
- Merge only after checklist chunk definition of done is satisfied.

## Publish Rules
- Merging to main triggers publish-chrome workflow.
- Publish can also run manually via workflow_dispatch.
- Only merge phase-complete chunks to main.

## Recommended Protection Settings (GitHub UI)
Apply branch protection on main:
- Require a pull request before merging.
- Require status checks to pass before merging:
  - PR Guardrails
  - Lint, Test, Build
- Require branches to be up to date before merging.
- Restrict who can push directly to main.

## Phase Completion Routine
1. Finish chunk implementation.
2. Validate locally.
3. Update docs/PROGRESS.md and checklist status.
4. Open PR with evidence.
5. Wait for CI green.
6. Merge to main.
7. Confirm publish workflow result.
