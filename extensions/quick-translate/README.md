# Quick Translate

Translate user-selected text in an approved tab with a local bubble.

## Features

- No default page access.
- Support one-tab and per-site activation.
- Use Shadow DOM for UI isolation.
- Cache results and configurable timeout requests.
- Disclose and isolate the remote translation request.

## How it works

1. **This tab**: popup uses activeTab to inject content script, then tells that script the tab is temporarily active. It expires on navigation.
2. **This site**: popup requests an optional host permission for the exact origin; background registers a persistent content script for that origin.
3. **All sites**: popup requests optional access to http and https origins after an explicit click; background registers one all-site content script.
4. Background calls Google Translate with an AbortController timeout and returns parsed text.

## Permissions

`activeTab`, `scripting`, `storage`, `https://translate.googleapis.com/*`; optional `http://*/*` and `https://*/*` are requested per site and never granted by default.

## Configuration

The base popup only shows the current site and one site enable/disable control. Language, timeout, temporary tab access, and all-site access are behind **Advanced settings**.

## Data model

`quick-translate.settings` stores provider, target language, timeout, approved origins, all-site mode, and per-site exceptions. Temporary tab activation is in-memory only.

## Limitations

- No broad host permission is enabled by default.
- Selections in editable fields are ignored.
- Text is limited to 1,000 characters.
- Only Google Translate is supported in v0.1.
- All-site access can be revoked globally; per-site disable entries act as exceptions.
- The bubble uses textContent, never innerHTML.

## Development

```bash
pnpm --filter "@hub/quick-translate" dev
pnpm --filter "@hub/quick-translate" build:chrome
pnpm --filter "@hub/quick-translate" build:firefox
```

Load `extensions/quick-translate/dist/chrome-mv3` in Chromium for local testing.

## Design and QA

- Detailed design: [`docs/design/plugins/quick-translate.md`](../../docs/design/plugins/quick-translate.md)
- QA checklist: [`docs/qa/quick-translate.md`](../../docs/qa/quick-translate.md)
- Store listing: [`docs/listings/quick-translate`](../../docs/listings/quick-translate)
