# Implementation Checklist

Purpose: execution plan for AI coding agents. Complete items in order, keep PRs small, and update progress after each merged chunk.

Status legend:
- [ ] Not started
- [~] In progress
- [x] Completed

## Phase 0: Foundation and Tooling
### Chunk 0.1 Project scaffold
- [ ] Initialize TypeScript WebExtensions workspace.
- [ ] Add build targets for Chromium and Firefox.
- [ ] Add lint, test, typecheck scripts.
- [ ] Add CI workflow for lint + test + build.

Suggested files:
- package.json
- tsconfig.json
- extension/manifest/chromium.manifest.json
- extension/manifest/firefox.manifest.json
- .github/workflows/ci.yml

Definition of done:
- Local dev build succeeds for Chromium and Firefox targets.
- CI green on default branch.

### Chunk 0.2 Shared contracts
- [ ] Create provider contract types.
- [ ] Create chat session and context event types.
- [ ] Create background message envelope types.

Suggested files:
- shared/provider-contract/types.ts
- shared/chat-session/types.ts
- shared/types/runtime-messages.ts

Definition of done:
- TypeScript strict checks pass with no any in shared contracts.

## Phase 1: Core Runtime Wiring
### Chunk 1.1 Background orchestration
- [ ] Implement message router in background.
- [ ] Implement provider router registry.
- [ ] Add health-check command path.

Suggested files:
- extension/background/index.ts
- extension/background/router.ts
- extension/background/provider-router.ts

Interfaces to implement:
- setActiveProvider(providerId)
- getActiveProvider()
- sendWithActiveProvider(request)

### Chunk 1.2 Popup launcher
- [ ] Build popup provider dropdown and status view.
- [ ] Add open-sidepanel action.

Suggested files:
- extension/popup/App.tsx
- extension/popup/state.ts
- extension/popup/styles.css

Definition of done:
- Provider can be selected in popup.
- Sidepanel opens from popup in supported browsers.

## Phase 2: Context Capture
### Chunk 2.1 URL and selected text
- [ ] Capture current tab URL.
- [ ] Capture selected text from page.
- [ ] Add context chips in sidepanel composer.

Suggested files:
- extension/content-script/selection.ts
- extension/sidepanel/components/ContextChips.tsx
- extension/background/context-normalizer.ts

### Chunk 2.2 Element snapshot
- [ ] Add element picker trigger.
- [ ] Capture selector, tag, role, text excerpt, bounding box.
- [ ] Send element snapshot as context event.

Suggested files:
- extension/content-script/element-picker.ts
- extension/capture/element-snapshot.ts
- extension/background/context-normalizer.ts

### Chunk 2.3 Screenshot capture
- [ ] Capture visible tab screenshot.
- [ ] Compress and size-bound image payload.
- [ ] Attach screenshot context chip with preview.

Suggested files:
- extension/capture/screenshot.ts
- extension/capture/compress.ts
- extension/sidepanel/components/ScreenshotChip.tsx

Definition of done:
- URL, text, element, screenshot can be attached and removed before send.

## Phase 3: Sidepanel Chat Experience
### Chunk 3.1 Sidepanel shell and chat stream
- [ ] Build sidepanel layout: session list, message pane, composer.
- [ ] Implement streaming assistant output rendering.
- [ ] Add send, stop, retry actions.

Suggested files:
- extension/sidepanel/App.tsx
- extension/sidepanel/components/SessionList.tsx
- extension/sidepanel/components/MessageList.tsx
- extension/sidepanel/components/Composer.tsx

### Chunk 3.2 Session lifecycle
- [ ] Create new session action.
- [ ] Resume prior session action.
- [ ] Rename and archive session actions.

Suggested files:
- shared/chat-session/store.ts
- extension/sidepanel/state/session-store.ts
- extension/sidepanel/components/SessionToolbar.tsx

Interfaces to implement:
- createSession(input)
- listSessions(filter)
- getSession(sessionId)
- renameSession(sessionId, title)
- archiveSession(sessionId)

### Chunk 3.3 Context timeline
- [ ] Render per-session context timeline.
- [ ] Link messages to context events where applicable.

Suggested files:
- extension/sidepanel/components/ContextTimeline.tsx
- shared/chat-session/index.ts

Definition of done:
- User can create/resume sessions and inspect past context events.

## Phase 4: Context Menu Quick Actions
### Chunk 4.1 Menu registration
- [ ] Register context menu actions on extension install/start.
- [ ] Support open chat, send selected text, send page URL.

Suggested files:
- extension/context-menu/register.ts
- extension/background/startup.ts

### Chunk 4.2 Immediate handoff flow
- [ ] Open sidepanel from context menu.
- [ ] Create or use active session.
- [ ] Inject context event and optional immediate send.

Suggested files:
- extension/context-menu/handlers.ts
- extension/background/handoff.ts

Definition of done:
- Right-click actions open chat and pass context immediately.

## Phase 5: Provider Integrations
### Chunk 5.1 Gemini adapter
- [ ] Implement adapter contract.
- [ ] Implement auth and health check.
- [ ] Implement streaming sendMessage.

Suggested files:
- providers/gemini/adapter.ts
- providers/gemini/auth.ts

### Chunk 5.2 Claude adapter
- [ ] Implement adapter contract.
- [ ] Implement auth and health check.
- [ ] Implement streaming sendMessage.

Suggested files:
- providers/claude/adapter.ts
- providers/claude/auth.ts

### Chunk 5.3 ChatGPT adapter
- [ ] Implement adapter contract.
- [ ] Implement auth and health check.
- [ ] Implement streaming sendMessage.

Suggested files:
- providers/chatgpt/adapter.ts
- providers/chatgpt/auth.ts

### Chunk 5.4 Dynamic provider registry
- [ ] Add provider registry abstraction.
- [ ] Add custom provider plugin entry path.

Suggested files:
- shared/provider-contract/registry.ts
- extension/background/provider-registry.ts

Definition of done:
- User can switch provider from UI without session data leakage.

## Phase 6: Connector and Authentication
### Chunk 6.1 Connector API baseline
- [ ] Create connector API service skeleton.
- [ ] Add token exchange endpoints.
- [ ] Add provider proxy endpoints.

Suggested files:
- connector-api/src/index.ts
- connector-api/src/routes/auth.ts
- connector-api/src/routes/provider-proxy.ts

### Chunk 6.2 Extension auth screens
- [ ] Provider setup forms.
- [ ] Connected/disconnected/error statuses.
- [ ] Re-auth flow and token refresh handling.

Suggested files:
- extension/sidepanel/components/ProviderSetup.tsx
- extension/popup/components/ProviderStatus.tsx

Definition of done:
- No long-lived provider secret stored directly in extension storage.

## Phase 7: Compliance, Hardening, and Release
### Chunk 7.1 Permission minimization
- [ ] Audit manifest permissions and host permissions.
- [ ] Remove unused capabilities.

### Chunk 7.2 Privacy and disclosures
- [ ] Add privacy policy and data handling description.
- [ ] Add in-product consent and context preview.

### Chunk 7.3 Store packaging
- [ ] Build release artifacts for Chrome Web Store.
- [ ] Build release artifacts for Firefox Add-ons.
- [ ] Complete store listing assets and metadata.

Suggested files:
- docs/STORE_COMPLIANCE.md
- docs/RELEASE_CHECKLIST.md

Definition of done:
- Builds pass store validation and are ready for submission.

## Parallel Work Guidance
- Frontend track: Phase 3 + part of Phase 1.2
- Runtime track: Phase 1.1 + Phase 4
- Provider track: Phase 5
- Platform/security track: Phase 6 + Phase 7

## Anti-Offtrack Rules for AI Agents
- Work only one chunk at a time.
- Do not start next chunk until current chunk definition of done is met.
- Keep changes small and scoped to listed files.
- Update progress tracker after each completed chunk.
- If architecture conflict appears, update docs first, then code.
