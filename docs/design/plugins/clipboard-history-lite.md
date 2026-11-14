# Clipboard History Lite design

## Purpose

Save only explicit copy events in a local history.

## Goals

- No clipboardRead permission.
- Capture only explicit `copy` events.
- Support per-site disable.
- Dedupe and cap history at 50 items.

## Architecture

- Browser surfaces live in `entrypoints/`.
- Reusable logic lives in `lib/`.
- Shared infrastructure comes from `@hub/shared`.

## Data and state

`clipboard-history.settings` stores history and disabled origins.

## User flow

Popup enables the content script; content script listens for copy events and saves sanitized text locally.

## Permissions and APIs

`activeTab`, `scripting`, `storage`, `clipboardWrite`.

Primary APIs: ClipboardEvent, runtime injection, `chrome.storage.local`, Clipboard API for popup copy.

## Boundaries and edge cases

- Does not monitor keystrokes or read the clipboard API.
- Text is capped at 10,000 characters.
- Disabled origins do not record data.

## Verification

History dedupe, search, per-site toggle, and settings validation are unit tested.

See also:

- [`extensions/clipboard-history-lite/README.md`](../../extensions/clipboard-history-lite/README.md)
- [`extensions/clipboard-history-lite/PLUGIN.md`](../../extensions/clipboard-history-lite/PLUGIN.md)
- [`docs/qa/clipboard-history-lite.md`](../../docs/qa/clipboard-history-lite.md)
