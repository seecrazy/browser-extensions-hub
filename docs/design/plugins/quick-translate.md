# Quick Translate design

## Purpose

Translate user-selected text in an activated tab with a local bubble.

## Goals

- No default page access.
- One-tab activation only.
- Use Shadow DOM for UI isolation.
- Store only the target language.
- Send selected text to Google Translate.

## Architecture

- Popup handles target-language selection and activation.
- Content script listens for text selection and shows a Shadow DOM bubble.
- Background calls Google Translate with an 8-second request timeout and a second Google endpoint fallback.

## Data and state

`quick-translate.settings` stores only the target language. Temporary activation is controlled by the popup and expires on navigation.

## User flow

1. Open popup and choose target language.
2. Click **Enable on this tab**.
3. Select text on the page.
4. The content script shows a translation bubble.

## Permissions and APIs

`activeTab`, `scripting`, `storage`, `https://translate.googleapis.com/*`.

Primary APIs: `chrome.scripting.executeScript`, runtime messages, `fetch`.

## Boundaries and edge cases

- No broad host permission is enabled by default.
- Selections in editable fields are ignored.
- Text is limited to 1,000 characters.
- Activation expires on navigation.
- The bubble uses `textContent`, never `innerHTML`.

## Verification

Manual QA: [`docs/qa/quick-translate.md`](../../docs/qa/quick-translate.md).

See also:

- [`extensions/quick-translate/PLUGIN.md`](../../extensions/quick-translate/PLUGIN.md)
