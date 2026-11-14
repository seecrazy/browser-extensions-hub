# Dark Mode Lite design

## Purpose

Apply a lightweight CSS dark mode to one origin without broad host access.

## Goals

- Provide immediate visual feedback.
- Remember per-site enabled state and strength.
- Avoid modifying page DOM beyond a style element.
- Keep activeTab-based injection; page reload requires reactivation.

## Architecture

- Browser surfaces live in `entrypoints/`.
- Reusable logic lives in `lib/`.
- Shared infrastructure comes from `@hub/shared`.

## Data and state

`dark-mode-lite.settings.sites[origin]` stores `{ enabled, strength }`.

## User flow

Popup injects `/content-scripts/dark-mode.js`; content script reads/writes per-site state and applies an inline CSS style.

## Permissions and APIs

`activeTab`, `scripting`, `storage`.

Primary APIs: `chrome.scripting.executeScript`, `chrome.storage.local`, runtime messages.

## Boundaries and edge cases

- No broad host permissions.
- Does not alter site data or network traffic.
- CSS inversion can affect pages that already control colors aggressively.
- Images, video, canvas, SVG, and iframes receive inverse compensation.

## Verification

Pure settings normalization and per-site patching are unit tested.

See also:

- [`extensions/dark-mode-lite/README.md`](../../extensions/dark-mode-lite/README.md)
- [`extensions/dark-mode-lite/PLUGIN.md`](../../extensions/dark-mode-lite/PLUGIN.md)
- [`docs/qa/dark-mode-lite.md`](../../docs/qa/dark-mode-lite.md)
