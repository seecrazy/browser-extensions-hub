# Quick Translate design

## Purpose

Translate user-selected text in an approved tab with a local bubble.

## Goals

- No default page access.
- Support one-tab and per-site activation.
- Use Shadow DOM for UI isolation.
- Cache results and timeout requests.
- Disclose and isolate the remote translation request.

## Architecture

- Browser surfaces live in `entrypoints/`.
- Reusable logic lives in `lib/`.
- Shared infrastructure comes from `@hub/shared`.

## Data and state

`quick-translate.settings` stores provider, target language, timeout, and approved origins.

## User flow

1. **This tab**: popup uses activeTab to inject content script; selection changes trigger translation.
2. **This site**: popup requests an optional host permission for the exact origin; background registers a persistent content script for that origin.
3. Background calls Google Translate with an AbortController timeout and returns parsed text.

## Permissions and APIs

`activeTab`, `scripting`, `storage`, `https://translate.googleapis.com/*`; optional `http://*/*` and `https://*/*` are requested per site and never granted by default.

Primary APIs: `chrome.permissions`, `chrome.scripting.registerContentScripts`, runtime messages, `fetch` with AbortController.

## Boundaries and edge cases

- No broad host permission is enabled by default.
- Selections in editable fields are ignored.
- Text is limited to 1,000 characters.
- Only Google Translate is supported in v0.1.
- The bubble uses textContent, never innerHTML.

## Verification

Translation parsing, settings validation, origin/match-pattern normalization, and per-site state are unit tested.

See also:

- [`extensions/quick-translate/README.md`](../../extensions/quick-translate/README.md)
- [`extensions/quick-translate/PLUGIN.md`](../../extensions/quick-translate/PLUGIN.md)
- [`docs/qa/quick-translate.md`](../../docs/qa/quick-translate.md)
