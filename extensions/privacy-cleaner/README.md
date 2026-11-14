# Privacy Cleaner Lite

Clear selected storage data for the current origin only when the user asks.

## Features

- Use per-origin browsingData cleanup.
- Avoid persistent `tabs` permission.
- Clearly show origin and selected data types.

## How it works

Popup reads the active tab origin; background calls `chrome.browsingData.remove({ origins: [origin] }, selectedTypes)`.

## Permissions

`activeTab`, `browsingData`, `storage`.

## Data model

`privacy-cleaner.settings` stores selected cleanup types.

## Limitations

- No cleanup history is stored.
- No automatic tab-close cleanup.
- Only http(s) origins are supported.
- At least one data type must be selected.

## Development

```bash
pnpm --filter "@hub/privacy-cleaner" dev
pnpm --filter "@hub/privacy-cleaner" build:chrome
pnpm --filter "@hub/privacy-cleaner" build:firefox
```

Load `extensions/privacy-cleaner/dist/chrome-mv3` in Chromium for local testing.

## Design and QA

- Detailed design: [`docs/design/plugins/privacy-cleaner.md`](../../docs/design/plugins/privacy-cleaner.md)
- QA checklist: [`docs/qa/privacy-cleaner.md`](../../docs/qa/privacy-cleaner.md)
- Store listing: [`docs/listings/privacy-cleaner`](../../docs/listings/privacy-cleaner)
