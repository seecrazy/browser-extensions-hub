# ADR 0011: Optional per-site access

## Status

Accepted

## Context

Quick Translate previously required users to reopen the popup and enable the current tab after every navigation. This is the most permission-minimal model, but it creates unnecessary friction for repeated use on the same site.

Broad `<all_urls>` access is rejected.

## Decision

Quick Translate adds two activation modes:

1. **This tab only**: uses `activeTab` and runtime injection; no persistent permission is stored.
2. **Always on this site**: requests one optional host permission for the exact current origin, registers a runtime content script for that origin, and remembers the user's choice.

Optional permissions are declared as `http://*/*` and `https://*/*`, but no permission is granted until the user approves it. Users can revoke site access from the popup, and permissions are synchronized with registered content scripts on startup/update.

## Consequences

- Default behavior remains no page access.
- Repeated use on one approved site no longer requires reopening the popup.
- The permission model remains explicit and revocable.
- Firefox and Chromium differences are handled defensively; unsupported registration falls back to tab-only injection.
