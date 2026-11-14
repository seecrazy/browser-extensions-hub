# Privacy Cleaner Lite design

## Purpose

Clear selected storage data for the current origin only when the user asks.

## Goals

- Use per-origin browsingData cleanup.
- Avoid persistent `tabs` permission.
- Clearly show origin and selected data types.

## Architecture

- Browser surfaces live in `entrypoints/`.
- Reusable logic lives in `lib/`.
- Shared infrastructure comes from `@hub/shared`.

## Data and state

`privacy-cleaner.settings` stores selected cleanup types.

## User flow

Popup reads the active tab origin; background calls `chrome.browsingData.remove({ origins: [origin] }, selectedTypes)`.

## Permissions and APIs

`activeTab`, `browsingData`, `storage`.

Primary APIs: `chrome.tabs.query`, `chrome.browsingData.remove`, `chrome.storage.local`.

## Boundaries and edge cases

- No cleanup history is stored.
- No automatic tab-close cleanup.
- Only http(s) origins are supported.
- At least one data type must be selected.

## Verification

Origin normalization, cleanup type mapping, and settings validation are unit tested.

See also:

- [`extensions/privacy-cleaner/README.md`](../../extensions/privacy-cleaner/README.md)
- [`extensions/privacy-cleaner/PLUGIN.md`](../../extensions/privacy-cleaner/PLUGIN.md)
- [`docs/qa/privacy-cleaner.md`](../../docs/qa/privacy-cleaner.md)
