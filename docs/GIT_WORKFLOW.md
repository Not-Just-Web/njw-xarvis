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

## AI Agent Git Operations (REQUIRED FOR AGENTS)
When running as an AI coding agent, ALWAYS use GitHub MCP (Model Context Protocol) tools for git operations instead of terminal commands. This ensures:
- Operations are traced in GitHub history
- PR metadata is correct
- No accidental direct commits to main
- Proper error handling and validation

### Agent MCP Tools Reference
**For PR Operations:**
- `mcp_io_github_git_create_pull_request` — Create PR from feature branch to main
  - Parameters: owner, repo, title (with [phase-X] tag), head (feature-branch), base (main), body (description + testing evidence)
  - Always include: testing validation, docs links, related issue/PR numbers
- `mcp_io_github_git_update_pull_request` — Update PR title, description, or state
  - Use when adding test results or updating description after changes
- `mcp_io_github_git_merge_pull_request` — Merge PR (only after CI passes)
  - Always use `merge_method: "squash"` for clean history
  - Only merge if all status checks are green

**For Branch Operations:**
- `mcp_io_github_git_create_branch` — Create new feature branch from main
  - Parameters: owner, repo, branch (format: feature/phase-X-name), from_branch (main)
- `mcp_io_github_git_push_files` — Push multiple files in one commit
  - Preferred over sequential file creation; more efficient
  - Use descriptive commit message with [phase-N] tag

**For Code Review & Validation:**
- `mcp_io_github_git_pull_request_read` — Check PR status, files changed, checks passing
  - Use before merging to verify all CI checks are green
  - Use method: "get_status" to check combined commit status
- `mcp_io_github_git_request_copilot_review` — Request automated code review for PR
  - Useful before human review to catch issues early

**For File Operations:**
- `mcp_io_github_git_create_or_update_file` — Create or update single file with commit
  - Use for single-file changes (docs, config)
  - Always provide sha for updates to existing files

### Example Agent Workflow
```yaml
Task: Implement feature and get it to main

1. Create Feature Branch
   - Use: mcp_io_github_git_create_branch
   - branch: "feature/phase-6-auth-ui"
   - from_branch: "main"

2. Make Code Changes Locally
   - Edit files in workspace
   - Run: yarn typecheck:all && yarn lint:all && yarn test && yarn build

3. Push Changes to GitHub
   - Use: mcp_io_github_git_push_files
   - branch: "feature/phase-6-auth-ui"
   - files: [all modified files with content]
   - message: "[phase-6] Implement auth UI screens with token management"

4. Create Pull Request
   - Use: mcp_io_github_git_create_pull_request
   - title: "[phase-6] Auth UI Screens + Token Management"
   - body: Include feature summary, test evidence, docs links
   - head: "feature/phase-6-auth-ui"
   - base: "main"

5. Wait for CI (via GitHub Actions dashboard or polling)
   - Check: mcp_io_github_git_pull_request_read (method: "get_status")

6. Merge to Main
   - Use: mcp_io_github_git_merge_pull_request
   - merge_method: "squash"
   - Only call after CI is green

7. Verify Release Workflow
   - Check GitHub Actions for auto-release triggering
```

### Terminal Commands (AVOID - USE MCP INSTEAD)
❌ **NEVER use** terminal for these operations:
```bash
git push origin main                    # Forbidden - violates workflow
git merge feature/branch                # Forbidden - use MCP PR merge
git commit && git push --force-with-lease  # Forbidden - use MCP push_files
```

✅ **OK to use terminal only for**:
- Local validation before pushing: `yarn typecheck:all && yarn lint:all && yarn test && yarn build`
- Checking local branch status: `git status`, `git log --oneline`
- Fetching latest main: `git fetch origin main`
- Switching branches locally: `git checkout feature/branch`

### Key Principles for Agents
1. **Always prefer MCP over terminal** for any GitHub operation (PR, branch, push, merge)
2. **Never use terminal** to push directly to main or merge branches
3. **Always wait for CI** before merging (check PR status via MCP)
4. **Always include PR metadata**: phase tag, testing evidence, docs links
5. **Always squash-merge** (not regular merge) for clean history
6. **Update PROGRESS.md** in PR commits before merge
7. **Verify release workflow** triggers after main merge (GitHub Actions)
