# Wireframes and UI Contracts

Purpose: visual and interaction source of truth before implementation.

## Source Files
- [Hero Preview](assets/sidepanel-hero.svg)
- [Sidepanel Wireframe](assets/wireframe-sidepanel.svg)
- [Context Capture Wireframe](assets/wireframe-context-capture.svg)
- [UAT QA Wireframe](assets/wireframe-uat-qa.svg)

## Layout Contract
- Browser content remains on the left and is not shifted by assistant UI changes.
- AI assistant is fixed to right sidepanel.
- Session rail is inside assistant only.
- Session rail behavior:
  - Default state: collapsed.
  - Toggle: hamburger button in sidepanel header.
  - Resizable by drag handle.

## Chat Contract
- Messenger-style bubbles:
  - Assistant on left.
  - User on right.
- Bubble widths and paddings must avoid overlap at all supported widths.
- Composer is anchored at panel bottom.

## Composer Contract
- Enter sends message.
- Shift+Enter inserts newline.
- Supports drag-drop image.
- Supports paste image.
- Supports one-click current-tab screenshot.

## Slash Skill Contract
Default slash skills:
- /screenshot
- /select-element
- /test-section
- /test-feature

## Visual Consistency Rules
- Use one radius scale across chips, bubbles, and inputs.
- Keep spacing on 4px/8px rhythm.
- Keep one primary blue action style for send and key CTAs.
- Do not introduce overlapping labels, chips, or controls.

## Design Freeze Gate
- Any changes to these contracts must update this file and wireframe assets together.
