# Project Progress Tracker

Purpose: single source of truth for execution status. Update this file after each merged chunk.

Last updated: 2026-05-07
Owner: AI coding agent

## Current Phase Summary
- Phase 0 Foundation: Completed
- Phase 1 Core Runtime Wiring: Completed
- Phase 2 Context Capture: Completed
- Phase 3 Sidepanel Chat Experience: Completed
- Phase 4 Context Menu Quick Actions: Completed
- Phase 5 Provider Integrations: Completed ✓
- Phase 6 Connector and Authentication: Not started
- Phase 7 Compliance, Hardening, and Release: Not started

## Active Chunk
- Chunk: 6.1 Connector API baseline
- Branch: feature/phase-6-connector-auth
- Status: Ready to start
- Blockers: None

## Release Readiness
- ✓ All tests passing (55/55)
- ✓ Lint and typecheck passing
- ✓ Build validated for Chromium and Firefox
- ✓ Release workflow includes pre-release validation (typecheck, lint, test)
- ✓ Main branch CI runs full validation on all pushes/PRs
- Version: 1.0.0 (set in package.json)
- Manual release available via GitHub Actions > release.yml > Run workflow

## Chunk Checklist Mirror
Reference: docs/IMPLEMENTATION_CHECKLIST.md

- [x] 0.1 Project scaffold
- [x] 0.2 Shared contracts
- [x] 1.1 Background orchestration
- [x] 1.2 Popup launcher
- [x] 2.1 URL and selected text
- [x] 2.2 Element snapshot
- [x] 2.3 Screenshot capture
- [x] 3.1 Sidepanel shell and chat stream
- [x] 3.2 Session lifecycle
- [x] 3.3 Context timeline
- [x] 4.1 Menu registration
- [x] 4.2 Immediate handoff flow
- [x] 5.1 Gemini adapter
- [x] 5.2 Claude adapter
- [x] 5.3 ChatGPT adapter
- [x] 5.4 Dynamic provider registry
- [ ] 6.1 Connector API baseline
- [ ] 6.2 Extension auth screens
- [ ] 7.1 Permission minimization
- [ ] 7.2 Privacy and disclosures
- [ ] 7.3 Store packaging

## Progress Log
Use one line per update.

| Date | Chunk | Status | Summary | PR/Commit |
|---|---|---|---|---|
| 2026-05-07 | Planning docs | Completed | Added architecture, implementation checklist, compliance checklist, and progress tracker | N/A |
| 2026-05-07 | Repo automation baseline | Completed | Added git workflow policy, PR validation workflow, Chrome publish workflow, release checklist, README, hero graphic, and .gitignore | N/A |
| 2026-05-07 | UX and wireframe alignment | Completed | Updated hero/wireframes for browser-left + right sidepanel, messenger-style bubbles, drag-drop/paste image, one-click screenshot, default slash skills, and Enter-to-send behavior | N/A |
| 2026-05-07 | Design polish and phase guardrails | Completed | Fixed wireframe SVG issue and added design-lock micro-phases, phase gates, and anti-drift execution rules for AI implementation | N/A |
| 2026-05-07 | 0.1 Project scaffold | Completed | Built React+TypeScript extension scaffold, added Chromium/Firefox manifests and builds, added Yarn CI, and validated typecheck/lint/test/build | Working tree |
| 2026-05-07 | 0.2 Shared contracts | Completed | Added provider/session/runtime message types and integrated runtime envelope validation in background handler | Working tree |
| 2026-05-07 | 1.1 Background orchestration | Completed | Added runtime router, active-provider registry, provider send flow, and health-check route in background service | Working tree |
| 2026-05-07 | 1.2 Popup launcher | Completed | Implemented popup provider selector, status view, and sidepanel open action with React UI | Working tree |
| 2026-05-07 | 2.1 URL capture + selection | Completed | Added content-script URL/text capture, element picker with overlay, screenshot capture, context normalizer with truncation guard | feature/phase-2-context-capture |
| 2026-05-07 | 3.1-3.3 Sidepanel chat | Completed | Session store (create/list/resume/archive), full chat UI with drag-drop/paste image, slash-skill autocomplete, hamburger session toggle, Enter-to-send, context chips | feature/phase-3-sidepanel-chat |
| 2026-05-07 | 4.1-4.2 Context menu | Completed | Registered open chat, send selection, send URL, send element context menus; immediate context handoff to sidepanel on click | feature/phase-4-context-menu |
| 2026-05-07 | 5.1-5.4 Provider adapters + tests | Completed | Implemented Gemini, Claude, ChatGPT adapters with real API structures; created dynamic provider registry; comprehensive test suite (55 tests) with shared mocks; added test validation to release workflow | feature/phase-5-provider-integrations |

## Agent Operating Rules
- Do not start two chunks at once unless explicitly planned in parallel tracks.
- Keep each chunk deliverable testable.
- Update this file and the checklist in the same change.
- If scope changes, update docs first, then continue implementation.
