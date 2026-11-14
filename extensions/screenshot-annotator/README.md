# Screenshot Annotator Lite

Capture the visible area of an approved tab and annotate it locally.

## Features

- User-triggered capture only.
- Keep image data on device.
- Support rectangle, arrow, text, and brush.
- Support undo, copy, and download.

## How it works

Popup calls `chrome.tabs.captureVisibleTab`; annotate page renders a canvas, collects operations, and exports locally.

## Permissions

`activeTab`, `storage`, `clipboardWrite`.

## Data model

Capture data URL is stored in `chrome.storage.session` and removed after the annotate page loads. Tool preferences are stored locally.

## Limitations

- Capture occurs only from the popup user gesture.
- No screenshot upload.
- Undo is local and memory-based.
- Cross-origin tab content is captured as pixels by the browser.

## Development

```bash
pnpm --filter "@hub/screenshot-annotator" dev
pnpm --filter "@hub/screenshot-annotator" build:chrome
pnpm --filter "@hub/screenshot-annotator" build:firefox
```

Load `extensions/screenshot-annotator/dist/chrome-mv3` in Chromium for local testing.

## Design and QA

- Detailed design: [`docs/design/plugins/screenshot-annotator.md`](../../docs/design/plugins/screenshot-annotator.md)
- QA checklist: [`docs/qa/screenshot-annotator.md`](../../docs/qa/screenshot-annotator.md)
- Store listing: [`docs/listings/screenshot-annotator`](../../docs/listings/screenshot-annotator)
