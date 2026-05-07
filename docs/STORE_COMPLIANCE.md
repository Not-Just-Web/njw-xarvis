# Chrome and Firefox Store Compliance Checklist

Purpose: ensure the extension can be published in Chrome Web Store and Firefox Add-ons with minimal review friction.

Status legend:
- [ ] Not started
- [~] In progress
- [x] Completed

## 1) Permissions and Capability Scope
- [ ] Request minimum required permissions only.
- [ ] Use activeTab where possible instead of broad host permissions.
- [ ] Explain each permission in listing text and internal docs.
- [ ] Validate no unused permissions remain before release.

## 2) User Data and Privacy
- [ ] Publish a privacy policy URL.
- [ ] Clearly disclose what data is collected, processed, stored, and shared.
- [ ] Explain provider data flow (extension -> connector or provider).
- [ ] Add user controls for context sharing and session deletion.
- [ ] Avoid collecting unnecessary personal data.

## 3) Security Expectations
- [ ] No hardcoded secrets in extension code.
- [ ] Prefer short-lived tokens and secure exchange.
- [ ] Sanitize page-derived data before transmission.
- [ ] Validate message origin and sender for runtime messages.
- [ ] Add abuse protections in connector API (rate limits, auth checks).

## 4) Content Script and Injection Rules
- [ ] Inject scripts only on explicit user action or needed pages.
- [ ] Limit host match patterns.
- [ ] Avoid remote code execution patterns.
- [ ] Ensure element picker and screenshot actions are user initiated.

## 5) UX and Policy-Safe Behavior
- [ ] No misleading UI or hidden behavior.
- [ ] Provide explicit context preview before sending to AI.
- [ ] Show provider connection state and error feedback.
- [ ] Provide clear opt-out for telemetry (if telemetry exists).

## 6) Package and Listing Readiness
- [ ] Build signed/packaged artifact for Chromium target.
- [ ] Build packaged artifact for Firefox target.
- [ ] Prepare screenshots, icon set, and short/long descriptions.
- [ ] Provide support contact and homepage links.
- [ ] Ensure version and changelog are accurate.

## 7) Submission Preflight
- [ ] Test install and runtime on Chrome stable.
- [ ] Test install and runtime on Firefox stable.
- [ ] Validate context menu quick actions in both browsers.
- [ ] Validate sidepanel chat and session resume behavior.
- [ ] Run manual privacy and permission review before upload.

## 8) Browser-Specific Notes
### Chrome Web Store
- [ ] Confirm compliance with Chrome Web Store user data policy.
- [ ] Confirm no prohibited remote code patterns.
- [ ] Confirm accurate single-purpose description in listing.

### Firefox Add-ons (AMO)
- [ ] Confirm compliance with AMO add-on policies.
- [ ] Confirm requested permissions are justified.
- [ ] Confirm source package or review artifacts are available if requested.

## 9) Release Gate
Release is allowed only when:
- All sections above are completed.
- Architecture and implementation checklist phases required for release are complete.
- Privacy policy and store listings reflect actual behavior.
