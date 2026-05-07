# Phase Execution Plan

Purpose: keep implementation small, ordered, and reviewable so AI agents do not drift.

## Delivery Order
1. Design Lock
2. Phase 0 Foundation
3. Phase 1 Core Runtime Wiring
4. Phase 2 Context Capture
5. Phase 3 Sidepanel Chat Experience
6. Phase 4 Context Menu Quick Actions
7. Phase 5 Provider Integrations
8. Phase 6 Connector and Authentication
9. Phase 7 Compliance and Release

## Current Focus
- Active phase: Phase 0 Foundation
- Current chunk: 0.1 Project scaffold

## Phase Rules
- Work one chunk at a time.
- Keep one PR per chunk where possible.
- Update checklist and progress in same PR.
- Do not start next chunk until definition-of-done is met.

## Chunk Handoff Template
Use this at chunk completion:
- What changed
- Files touched
- Validation run
- Risks remaining
- Next chunk to start

## Validation Ladder per Chunk
1. Typecheck
2. Lint
3. Unit tests
4. Build
5. Manual extension smoke test (if UI/runtime changed)

## Drift Prevention
- If work needs files outside current chunk, stop and split work.
- If architecture mismatch appears, update docs first, then code.
- If design mismatch appears, update wireframe docs before implementation.
