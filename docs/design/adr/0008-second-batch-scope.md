# ADR 0008: Second Batch Scope

## Status

Accepted

## Context

The first five plugins validated core entrypoints and shared infrastructure. The second batch should cover higher-compliance and higher-complexity extension categories without increasing permissions beyond what the feature requires.

## Decision

Implement:

1. New Tab Dashboard — local time, todos, shortcuts, and no search override.
2. Privacy Cleaner — manual per-origin cleanup only; do not implement automatic tab-close cleanup because it would require persistent `tabs` URL tracking.
3. Reading Progress — runtime content script with per-site preference.
4. Clipboard History Lite — capture only explicit copy events; no `clipboardRead`.
5. Screenshot Annotator — user-triggered capture, local canvas annotation, copy/download.

## Consequences

- New Tab Dashboard does not modify search settings and does not include a search box.
- Privacy Cleaner is manual and per-origin in this iteration.
- Clipboard History does not request `clipboardRead`; it captures only data from user-initiated `copy` events.
- Screenshot capture is user-triggered and remains local until copy/download.
- All plugins use activeTab/runtime injection where page access is required.
