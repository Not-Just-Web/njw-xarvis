# Git Workflow and Release Policy

Purpose: keep development structured and releasable.

## Branching Rules (STRICT)
- Default branch: main
- **NEVER commit directly to main.** All work must go through PRs.
- **NEVER merge feature branches directly to main.** Only create PRs, never use `git merge`.
- Each feature or chunk MUST use its own branch.
- Branch naming format:
  - feature/phase-X-short-name
  - fix/short-name
  - docs/short-name

Examples:
- feature/phase-1-background-router
- feature/phase-3-session-resume
- fix/provider-routing-timeout

**Enforcement:**
- If main branch protection is configured, direct pushes are blocked
- All commits must be PR commits, visible in GitHub PR history
- Enforce locally: never run `git push origin main` with uncommitted changes

## PR Rules (MANDATORY)
- **EVERY change to main must come through a PR.** No exceptions.
- Create PR before any merge attempt:
  ```bash
  git push origin feature/branch-name
  # Then create PR via GitHub web UI or CLI
  ```
- **Do NOT merge code locally and push to main.** PR must exist in GitHub.
- PR title MUST include one tag:
  - [phase-0], [phase-1], [phase-2], [phase-3], [phase-4], [phase-5], [phase-6], [phase-7], [infra], [docs], [fix]
  - Example: `[phase-5] Provider Adapters & Comprehensive Test Suite`
- PR description must include:
  - Feature summary
  - Testing evidence (local validation)
  - Link to related docs (PROGRESS.md, IMPLEMENTATION_CHECKLIST.md)
- **PR must pass CI workflow green** before merge:
  - Lint ✓
  - Typecheck ✓
  - Test ✓
  - Build ✓
- Require PR review or self-review via GitHub interface
- Update docs/PROGRESS.md in same PR commit

**Strict Enforcement:**
- If PR validation fails, fix the branch and push again - do NOT merge with failures
- If merge is attempted without PR in GitHub history, that is a violation
- All commits must be traceable to their PR number in GitHub

## Merge Rules (STRICT - NEVER BYPASS)
- **NEVER use `git merge` to merge to main locally.** This is a violation of the workflow.
- **ALL merges must happen via GitHub PR UI only.**
- Merge only after validation is green:
  - CI Lint ✓
  - CI Typecheck ✓
  - CI Test ✓
  - CI Build ✓
- Merge only after the chunk definition of done is satisfied
- Merge strategy: **Squash and merge** for clean, linear history
- After merge, verify the auto-release workflow is triggered in GitHub Actions

**Violations & Recovery:**
- If code is accidentally merged directly to main: immediately revert and recreate as PR
- If commits appear on main without PR history: revert and redo via proper PR process
- Document any accidental direct commits in PR description when recreating

## Publish Rules
- **Release workflow auto-triggers on every push to main.**
- Release workflow only runs if CI validation passes:
  - typecheck ✓
  - lint ✓
  - test ✓
  - build ✓
- Release auto-skips if tag already exists for version (idempotent)
- Manual trigger available via workflow_dispatch if needed
- Only merge release-ready code to main (no partial/incomplete chunks)

## Recommended Protection Settings (GitHub UI)
Apply branch protection on main:
- Require a pull request before merging.
- Require status checks to pass before merging:
  - PR Guardrails
  - Lint, Test, Build
- Require branches to be up to date before merging.
- Restrict who can push directly to main.

## Phase Completion Routine (MANDATORY - NEVER SKIP STEPS)
1. Finish chunk implementation on feature branch
2. Validate locally: `yarn typecheck && yarn lint && yarn test && yarn build` (all must pass)
3. Update `docs/PROGRESS.md` and `docs/IMPLEMENTATION_CHECKLIST.md` status
4. Commit all changes: `git add -A && git commit -m "[phase-N] feature description"`
5. Push branch: `git push origin feature/phase-N-name`
6. **Create PR on GitHub web UI** (never merge locally):
   - Title: `[phase-N] Short Description`
   - Description: feature summary, testing evidence, related docs
   - Link to PROGRESS.md, IMPLEMENTATION_CHECKLIST.md
7. **Wait for CI to pass** on GitHub (lint, typecheck, test, build must all be ✓)
8. **Merge via GitHub UI only** (Squash and merge)
9. Verify release workflow triggers in GitHub Actions
10. Confirm release artifacts created (chromium + firefox zips)
