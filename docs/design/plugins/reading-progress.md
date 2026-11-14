# Reading Progress Lite design

## Purpose

Show a per-site reading progress indicator on long pages.

## Goals

- Use rAF-throttled scroll updates.
- Remember color, height, position, and offsets.
- Avoid network requests.

## Architecture

- Browser surfaces live in `entrypoints/`.
- Reusable logic lives in `lib/`.
- Shared infrastructure comes from `@hub/shared`.

## Data and state

`reading-progress.settings.sites[origin]` stores enabled state and style settings.

## User flow

Popup injects content script; content script listens to scroll/resize and updates a fixed bar.

## Permissions and APIs

`activeTab`, `scripting`, `storage`.

Primary APIs: DOM/scroll events, requestAnimationFrame, runtime messages, storage.

## Boundaries and edge cases

- No page content is read or transmitted.
- Top/bottom offsets help avoid fixed headers/footers.
- Only main frame is targeted.

## Verification

Preference normalization, per-site patching, and scroll ratio calculation are unit tested.

See also:

- [`extensions/reading-progress/README.md`](../../extensions/reading-progress/README.md)
- [`extensions/reading-progress/PLUGIN.md`](../../extensions/reading-progress/PLUGIN.md)
- [`docs/qa/reading-progress.md`](../../docs/qa/reading-progress.md)
