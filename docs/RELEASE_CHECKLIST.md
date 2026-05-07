# Release Checklist

Purpose: final release gate before merging to main for publish.

Status legend:
- [ ] Not started
- [~] In progress
- [x] Completed

## 1) Feature Quality
- [ ] Target phase chunks are complete.
- [ ] Manual QA completed for sidepanel chat flow.
- [ ] Session resume/new session behavior verified.
- [ ] Context capture paths verified (URL/text/element/screenshot).

## 2) Provider Quality
- [ ] Provider switching works with no data leakage.
- [ ] Gemini flow validated.
- [ ] Claude flow validated.
- [ ] ChatGPT flow validated.
- [ ] Error handling and retry validated.

## 3) Security and Compliance
- [ ] Permission audit complete.
- [ ] Privacy policy available and accurate.
- [ ] No hardcoded secrets in extension code.
- [ ] Store compliance checklist complete.

## 4) CI and Branching
- [ ] PR Validation workflow green.
- [ ] PR reviewed and approved.
- [ ] docs/PROGRESS.md updated.
- [ ] docs/IMPLEMENTATION_CHECKLIST.md statuses updated.

## 5) Release Automation
- [ ] Chrome publish secrets configured.
- [ ] publish-chrome workflow tested via workflow_dispatch.
- [ ] Main-branch publish behavior confirmed.

## 6) Post-Merge Verification
- [ ] Publish workflow run succeeded on main.
- [ ] Published version metadata matches release notes.
- [ ] Tag/release notes prepared (if using tags).
