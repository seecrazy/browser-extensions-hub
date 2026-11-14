# New Tab Dashboard Lite design

## Purpose

Provide a local dashboard without taking over search.

## Goals

- Respect browser search settings.
- Keep todos and shortcuts local.
- Sanitize every shortcut URL.
- Keep the UI responsive and local.

## Architecture

- Browser surfaces live in `entrypoints/`.
- Reusable logic lives in `lib/`.
- Shared infrastructure comes from `@hub/shared`.

## Data and state

`newtab-dashboard.settings` stores todos and shortcuts.

## User flow

New tab page renders time/date, todos, and shortcut links; UI patches namespaced storage.

## Permissions and APIs

`storage`.

Primary APIs: DOM, `chrome.storage.local`.

## Boundaries and edge cases

- No search box, no search API, no search-settings modification.
- Only http(s) shortcuts are accepted.
- No remote content or ads.

## Verification

Todo/shortcut helpers, URL sanitizer, and settings validation are unit tested.

See also:

- [`extensions/newtab-dashboard/README.md`](../../extensions/newtab-dashboard/README.md)
- [`extensions/newtab-dashboard/PLUGIN.md`](../../extensions/newtab-dashboard/PLUGIN.md)
- [`docs/qa/newtab-dashboard.md`](../../docs/qa/newtab-dashboard.md)
