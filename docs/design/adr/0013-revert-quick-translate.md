# ADR 0013: Revert Quick Translate to first-version scope

## Status

Accepted

## Context

Later iterations added per-site permissions, all-site access, advanced settings, and synchronization logic. These expanded the permission and state model faster than the feature needed and made both the popup and content-script flow harder to verify.

## Decision

Quick Translate is reverted to its first-version scope:

- target-language selection;
- explicit **Enable on this tab** activation using `activeTab`;
- Shadow DOM translation bubble;
- Google Translate request from the background;
- no per-site/all-site permissions;
- no advanced settings or persistent registered content scripts.

## Consequences

- No optional host permissions are declared.
- The popup and content-script flow are simpler to test.
- Per-site and all-site access can be reintroduced only after the simple flow is proven.
