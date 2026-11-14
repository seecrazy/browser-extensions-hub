# Tab Stash design

## Purpose

Save tabs from the current window into local named groups, then restore them later.

## Goals

- Write storage before closing tabs.
- Support one-tab and whole-group restore.
- Support search, rename, delete, import, and export.
- Avoid host permissions.

## Architecture

- Browser surfaces live in `entrypoints/`.
- Reusable logic lives in `lib/`.
- Shared infrastructure comes from `@hub/shared`.

## Data and state

`tab-stash.groups` stores an array of groups with stable group/tab ids. `tab-stash.settings` stores the pinned-tab preference.

## User flow

Popup asks background to stash current-window tabs; background filters browser pages, persists a group, then closes the source tabs.

## Permissions and APIs

`tabs`, `storage`.

Primary APIs: `chrome.tabs.query/remove/create`, `chrome.storage.local`, runtime messages.

## Boundaries and edge cases

- Chrome and extension pages are never stashed.
- Pinned tabs are skipped unless explicitly enabled.
- Restore can open many tabs; the UI confirms first.
- Imported URLs are sanitized and non-http(s) entries are dropped.

## Verification

Stash filtering, duplicate detection, search, and import normalization are unit tested.

See also:

- [`extensions/tab-stash/README.md`](../../extensions/tab-stash/README.md)
- [`extensions/tab-stash/PLUGIN.md`](../../extensions/tab-stash/PLUGIN.md)
- [`docs/qa/tab-stash.md`](../../docs/qa/tab-stash.md)
