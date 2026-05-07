# njw-xarvis Architecture

Purpose: define a stable architecture for njw-xarvis, a cross-browser AI assistant extension that works in Chrome, Firefox, and Brave.

## 1) Product Goals
- Open AI chat in a browser sidepanel.
- Send context from current page: URL, selected text, selected element metadata, and screenshot.
- Support multiple AI providers (Gemini, Claude, ChatGPT) with provider switching.
- Persist chat sessions with resume and new session flows.
- Allow future provider plugins without refactoring core modules.
- Support default slash skills in chat: /screenshot, /select-element, /test-section, /test-feature.
- Support one-click current-tab screenshot and drag-drop/paste image in composer.
- Support Enter-to-send and Shift+Enter-for-newline message behavior.

## 2) Non-Goals (Phase 1)
- No mobile browser extension support.
- No cross-device sync in first release.
- No autonomous browsing actions without user trigger.

## 3) System Modules
- extension/popup
  - Lightweight launcher.
  - Shows active provider and connection health.
  - Button to open sidepanel.
- extension/sidepanel
  - Primary chat interface.
  - Session list, session detail, context timeline, composer.
  - Context chips for URL, screenshot, selected element, selected text.
- extension/background
  - Central orchestrator.
  - Receives messages from popup, sidepanel, content scripts, and context menu.
  - Routes normalized request payloads to selected provider adapter.
- extension/content-script
  - Reads page selection and element metadata safely.
  - Triggers element capture flow when requested.
- extension/capture
  - Screenshot capture and image compression.
  - DOM element snapshot extraction helpers.
- extension/context-menu
  - Right-click actions:
    - Open AI chat
    - Send selected text
    - Send page URL
    - Send selected element snapshot
- shared/provider-contract
  - Canonical provider interface and capability model.
- shared/chat-session
  - Session model, message model, context event model, local index.
- providers/gemini, providers/claude, providers/chatgpt
  - One adapter per provider.
- connector-api (recommended)
  - Token exchange and provider proxy to avoid exposing secrets.

## 4) Core Data Models
### ChatSession
- id: string
- title: string
- providerId: string
- createdAt: number
- updatedAt: number
- archived: boolean

### ChatMessage
- id: string
- sessionId: string
- role: user | assistant | system
- content: string
- createdAt: number
- providerId: string
- tokenUsage: optional object

### ContextEvent
- id: string
- sessionId: string
- type: url | selectedText | element | screenshot
- payload: structured object by type
- sourceTabId: number
- sourceUrl: string
- createdAt: number

## 5) Interface Contracts (Type Signatures)
### Provider Adapter
- getMetadata(): { id, displayName, supports }
- authenticate(config): Promise<AuthResult>
- sendMessage(request): AsyncIterable<ProviderStreamEvent>
- healthCheck(): Promise<ProviderHealth>

### Provider Router
- setActiveProvider(providerId): Promise<void>
- getActiveProvider(): Promise<string>
- sendWithActiveProvider(request): AsyncIterable<ProviderStreamEvent>

### Session Store
- createSession(input): Promise<ChatSession>
- listSessions(filter): Promise<ChatSession[]>
- getSession(sessionId): Promise<ChatSession | null>
- appendMessage(sessionId, message): Promise<void>
- appendContextEvent(sessionId, event): Promise<void>
- renameSession(sessionId, title): Promise<void>
- archiveSession(sessionId): Promise<void>

## 6) Message and Event Flow
1. User opens sidepanel from popup or context menu.
2. Sidepanel loads active session or creates a new session.
3. User adds context chips or triggers right-click quick-send.
4. Sidepanel sends a normalized request to background.
5. Background resolves active provider and session.
6. Background streams provider response events to sidepanel.
7. Sidepanel renders incremental output and persists final message.
8. Session and context index are updated for resume/search.

## 7) Storage Strategy
- Use browser storage local for session index and metadata.
- Use IndexedDB for larger payloads (images, long transcripts) to avoid storage pressure.
- Keep screenshot binaries compressed and size-limited.
- Keep provider auth state minimal; prefer connector-issued short-lived tokens.

## 8) Security and Privacy Boundaries
- Explicit user action required before sending context.
- Redact sensitive fields when possible before provider call.
- Never hardcode provider secrets in extension bundles.
- Minimize host permissions; use activeTab and optional host permissions strategy.
- Add clear user-visible consent and context preview before send.

## 9) Sidepanel UX Requirements
- Fast first paint and responsive layout.
- Messenger-style message bubbles: assistant on left, user on right.
- Streaming text rendering with cancel and retry.
- Session list with last-updated sorting and search.
- Session list must be collapsible/expandable inside the sidepanel and never affect the left browser tab layout.
- Resume session, create new session, and per-session context timeline.
- Context chip remove and inspect before send.
- Clear connection and provider status badges.
- Include slash-skill suggestions and quick insert actions.
- Keep composer anchored with one-click screenshot and drag-drop image affordance.

## 10) Browser Compatibility Notes
- Base APIs: WebExtensions-compatible APIs.
- Chromium and Firefox differences must be isolated in small adapter utilities.
- Provide one manifest build target for Chromium and one for Firefox if needed.

## 11) Suggested Directory Map
- extension/manifest
- extension/popup
- extension/sidepanel
- extension/background
- extension/content-script
- extension/context-menu
- extension/capture
- shared/provider-contract
- shared/chat-session
- shared/types
- providers/gemini
- providers/claude
- providers/chatgpt
- connector-api
- tests
- docs

## 12) Delivery Micro-Phases
Use these micro-phases to keep implementation small and reviewable.

### M0 Design Lock
- Finalize sidepanel-hero and all wireframes.
- Freeze layout primitives: header, session rail, chat canvas, composer, chip row.
- Freeze interaction primitives: enter-send, shift-enter newline, slash skills, drag-drop/paste.

### M1 Contracts and Runtime Skeleton
- Finalize shared types and runtime message envelopes.
- Add background router + provider router skeleton with typed command paths.

### M2 Capture Foundations
- URL capture and selected text capture.
- Screenshot capture + compression.
- Element picker + element snapshot payload.

### M3 Sidepanel UX Core
- Messenger-style bubbles.
- Collapsible/expandable session rail with resize handle behavior.
- Composer behavior and context chips.

### M4 Session and Context Intelligence
- Session create/resume/rename/archive.
- Per-session context timeline and event linking.

### M5 Provider Integrations
- Gemini, Claude, ChatGPT adapters.
- Provider switching and health checks.

### M6 Connector, Auth, and Hardening
- Connector API proxy/token exchange.
- Security, privacy, and permission hardening.

### M7 Store Readiness and Release
- Chrome + Firefox packaging.
- Compliance pass and release checklist completion.

## 13) Phase Gates (Do Not Skip)
- Gate A: M0 approved before coding UI.
- Gate B: M1 types stable before provider-specific logic.
- Gate C: M3 UX acceptance before advanced UAT flows.
- Gate D: M6 security review before store submission.
- Gate E: M7 release checklist complete before publish.
