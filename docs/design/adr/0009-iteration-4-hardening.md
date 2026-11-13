# ADR 0009: Iteration 4 Hardening

## Status

Accepted

## Context

Ten plugins now cover the intended API scenarios. The remaining risk is not breadth but shared-layer correctness, release readiness, browser-level verification, and UX consistency.

## Decision

- Serialize writes per namespaced storage key to prevent lost updates.
- Add shared runtime injection and popup status helpers.
- Remove blocking browser dialogs from extension UI.
- Add per-site disable and expiry to Clipboard History.
- Add reading progress offset.
- Improve Privacy Cleaner result text.
- Add Screenshot Annotator brush, undo shortcut, Esc cancellation, and session capture cleanup.
- Add store-readiness validation, manual QA checklists, per-plugin docs, CodeQL, CI timeouts, coverage, release smoke checks, and a Playwright E2E skeleton.

## Consequences

- Shared behavior becomes easier to maintain.
- Local storage remains local; no new permissions are added.
- E2E tests are separated from fast unit tests so normal development stays lightweight.
- Store listing and QA artifacts become release gates rather than afterthoughts.
