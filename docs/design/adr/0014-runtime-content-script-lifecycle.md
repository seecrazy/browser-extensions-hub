# ADR 0014: Runtime Content Script Lifecycle

## Status

Accepted

## Context

Runtime-injected content scripts used a custom `window` marker to prevent
duplicate registration. This conflicted with WXT's content-script lifecycle.
When a script was injected again, WXT invalidated the older context while the
new script exited early because the marker already existed. The page was left
without an active message listener, producing
`Could not establish connection. Receiving end does not exist.`

Chrome can also return this transient error when `executeScript` has resolved
but a freshly injected module has not yet registered `runtime.onMessage`.

## Decision

- Runtime-injected content scripts register their message handlers on every
  injection instead of checking a custom installed marker.
- WXT's built-in context invalidation is the source of truth for replacing an
  older injected script.
- Tab message senders created by `@hub/shared` briefly retry the specific
  `Receiving end does not exist` error so a fresh listener can finish
  registering.
- Runtime integration tests repeatedly inject and message the content script
  immediately after `executeScript` returns.

## Consequences

- Reopening a popup cannot leave the page disconnected.
- Duplicate handler ownership is deterministic: the newest WXT context wins and
  the previous context is invalidated.
- No additional host permissions are required.
- The shared retry is limited to tab messages and does not mask permanent
  permission or missing-page failures after its short window.
