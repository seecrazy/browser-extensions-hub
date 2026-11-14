# Clipboard History Lite

Save only explicit copy events in a local, expirable history.

## Features

- No clipboardRead permission.
- Capture only explicit `copy` events.
- Support per-site disable and expiry.
- Dedupe and cap history at 50 items.

## How it works

Popup enables the content script; content script listens for copy events and saves sanitized text locally.

## Permissions

`activeTab`, `scripting`, `storage`, `clipboardWrite`.

## Configuration

Site access and history are always visible. Retention days are in **Advanced retention**.

## Data model

`clipboard-history.settings` stores history, disabled origins, and expiry days.

## Limitations

- Does not monitor keystrokes or read the clipboard API.
- Text is capped at 10,000 characters.
- History expires after the configured number of days.
- Disabled origins do not record data.

## Development

```bash
pnpm --filter "@hub/clipboard-history-lite" dev
pnpm --filter "@hub/clipboard-history-lite" build:chrome
pnpm --filter "@hub/clipboard-history-lite" build:firefox
```

Load `extensions/clipboard-history-lite/dist/chrome-mv3` in Chromium for local testing.

## Design and QA

- Detailed design: [`docs/design/plugins/clipboard-history-lite.md`](../../docs/design/plugins/clipboard-history-lite.md)
- QA checklist: [`docs/qa/clipboard-history-lite.md`](../../docs/qa/clipboard-history-lite.md)
- Store listing: [`docs/listings/clipboard-history-lite`](../../docs/listings/clipboard-history-lite)
