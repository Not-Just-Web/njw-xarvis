# AGENTS.md

Purpose: guide AI coding agents working in this repository.

## Project Scope
Build a cross-browser extension (Chrome, Firefox, Brave) that lets users:
- Capture browser context (URL, screenshot, selected element metadata/text).
- Send context to a selected AI provider from the extension UI.
- Chat in a browser sidepanel and switch providers dynamically.
- Keep chat history with resumable sessions and explicit new-session creation.
- Open chat quickly from browser right-click menu with immediate context handoff.
- Add future providers without rewriting core logic.

Supported providers in phase 1:
- Gemini
- Claude
- ChatGPT

## Product Opinion (recommended direction)
- Use WebExtensions API for cross-browser compatibility.
- Keep provider calls server-side via a small connector API (recommended) to avoid exposing raw API keys in extension storage.
- Use an adapter/plugin interface for providers so adding new AI backends is a new module, not a refactor.
- Keep capture and provider systems decoupled: context collection should not depend on any specific AI vendor.

## Architecture Blueprint
Main modules:
- `extension/popup`: launcher, provider quick status, and "open sidepanel" controls.
- `extension/sidepanel`: full chat UI, session list, context timeline, composer, and provider switcher.
- `extension/background`: orchestrates capture, auth state, message routing.
- `extension/content-script`: reads selected element info and page context.
- `extension/capture`: screenshot + DOM selection utilities.
- `extension/context-menu`: right-click actions to open sidepanel and send selected context immediately.
- `shared/provider-contract`: common interface for AI providers.
- `shared/chat-session`: session storage model, history indexing, and resume/new-session helpers.
- `providers/{gemini,claude,chatgpt}`: vendor adapters implementing the contract.
- `connector-api` (optional but recommended): token handling, provider proxying, usage logging.

Provider contract (minimum):
- `id`: stable provider id.
- `displayName`: UI label.
- `authenticate(config)`: validates credentials/session.
- `sendMessage(payload)`: sends prompt + browser context.
- `supports`: capabilities (vision, tools, max payload hints).

## Data Flow
1. User chooses provider in popup.
2. User opens sidepanel from popup or browser context menu.
3. User captures context (URL only, element, or screenshot) or sends selection directly from right-click.
4. Sidepanel sends request to background script with active session id (or requests new session).
5. Background normalizes payload and calls selected provider adapter (or connector API).
6. Response streams back to sidepanel chat and is persisted in session history.

## Security Rules
- Do not hardcode secrets.
- Prefer OAuth or short-lived tokens through connector API.
- Store minimal auth state in browser storage.
- Sanitize page content before transmission.
- Provide explicit user controls: what to share and when.

## UX Rules
- Must work on desktop widths >= 320px in popup.
- Sidepanel chat is the primary interaction surface and should feel polished and modern.
- Sidepanel message UI should use modern messenger-style bubbles (assistant left, user right).
- Show provider status: connected/disconnected/error.
- Preview what context will be sent before submit.
- Keep provider switching stateful but isolated (no cross-provider message leakage).
- Support session management: create new chat, resume past chat, and view per-session context history.
- Session list must be collapsible/expandable within the sidepanel and must not shift or alter left tab page content.
- Add context chips in the composer (URL, element, screenshot) with remove/inspect actions before send.
- Composer must support one-click current-tab screenshot, drag-drop/paste image, Enter-to-send, and Shift+Enter newline.
- Provide default slash skills: /screenshot, /select-element, /test-section, /test-feature.
- Provide right-click quick actions: open AI chat, send selected text, send element snapshot, send page URL.

## Build Plan (implementation phases)
Phase 0: Foundation
- Scaffold WebExtensions app with TypeScript.
- Add popup, background, content script wiring.
- Define shared provider contract and capability flags.

Phase 1: Context Capture
- Implement URL capture.
- Implement element picker + extracted text/selector snapshot.
- Implement screenshot capture and compression.

Phase 2: Provider Integrations
- Implement Gemini adapter.
- Implement Claude adapter.
- Implement ChatGPT adapter.
- Add provider dropdown + health checks.

Phase 3: Sidepanel Chat Experience
- Build sidepanel chat UI with message streaming and markdown rendering.
- Add session list, resume flow, and explicit "new chat" action.
- Persist chat + context events in extension storage with lightweight indexing.
- Add context-menu actions for immediate send-to-chat flows.

Phase 4: Connector and Auth
- Add connector API for token exchange and secure proxy.
- Add extension auth setup screens per provider.
- Add retry and error categories.

Phase 5: Extensibility
- Add dynamic provider registration.
- Add "Custom Provider" setup wizard (endpoint, auth type, model list).
- Add basic telemetry and provider usage stats.

## Coding Conventions
- TypeScript strict mode.
- Keep provider-specific logic out of UI components.
- Use small, testable pure functions for payload transforms.
- Prefer explicit types over `any`.
- Add tests for provider contract compliance and payload normalization.

## Suggested Commands (when project is scaffolded)
- Install: `yarn install`
- Dev build: `yarn dev`
- Production build: `yarn build`
- Test: `yarn test`
- Lint: `yarn lint`

If command names differ after scaffolding, update this file immediately.

## GitHub Repository Secrets

The following secrets must be configured for CI/CD to work properly:

### CHROME_CRX_PRIVATE_KEY
- **Purpose**: Sign Chrome extension packages for release
- **Format**: Base64-encoded 2048-bit RSA private key
- **Setup** (one-time):
  ```bash
  openssl genrsa -out chrome-extension-key.pem 2048
  cat chrome-extension-key.pem | base64 | gh secret set CHROME_CRX_PRIVATE_KEY --repo Not-Just-Web/njw-xarvis
  ```
- **Location**: https://github.com/Not-Just-Web/njw-xarvis/settings/secrets/actions
- **Used by**: `.github/workflows/release.yml` (generates signed `.crx` files for download)
- **When needed**: Every new release needs this to generate installable Chrome extensions

### Future Secrets (not yet required)
- `WEBSTORE_API_KEY`: For Chrome Web Store distribution
- `FIREFOX_API_KEY`: For Firefox Add-ons distribution

## What to Update Next
Primary implementation docs:
- [Architecture](docs/ARCHITECTURE.md)
- [Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md)
- [Store Compliance Checklist](docs/STORE_COMPLIANCE.md)
- [Progress Tracker](docs/PROGRESS.md)
- [Git Workflow](docs/GIT_WORKFLOW.md)
- [Release Checklist](docs/RELEASE_CHECKLIST.md)

Execution rules (STRICT):
- **Never commit directly to main.** All work requires a PR on GitHub.
- **Never merge branches directly.** Always create PR first via GitHub web UI or CLI, wait for CI to pass, then merge via GitHub.
- Git workflow: branch → commit → push → GitHub PR → CI validation → merge
- AI coding agents must NEVER run `git merge` or `git push origin main` with local commits.
- AI coding agents must update [docs/PROGRESS.md](docs/PROGRESS.md) whenever a checklist chunk is completed or status changes, as a PR commit.
- If direct commits happen to main (mistake), revert immediately and recreate as PR.
- All commits must be traceable to their PR number in GitHub history.

Phase Completion Workflow (MANDATORY):
1. Finish chunk implementation on feature branch
2. Validate locally: `yarn typecheck && yarn lint && yarn test && yarn build` (all passing)
3. Update `docs/PROGRESS.md` and `docs/IMPLEMENTATION_CHECKLIST.md` status
4. Commit: `git add -A && git commit -m "[phase-N] feature description"`
5. Push: `git push origin feature/phase-N-name`
6. **Create PR on GitHub** (do NOT merge locally)
7. Title PR with: `[phase-N] Short Description`
8. Add description: feature summary, testing evidence, links to docs
9. Wait for CI to pass (lint, typecheck, test, build)
10. Merge via GitHub UI only (use "Squash and merge" for clean history)
11. Verify release workflow triggers (auto-release from main merge)

When repository files are added, update this document with links to:
- contributor docs
- setup and environment docs
Keep this file brief; link to detailed docs instead of duplicating content.
