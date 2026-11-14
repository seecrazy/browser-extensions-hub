# Screenshot Annotator Lite design

## Purpose

Capture the visible area of an approved tab and annotate it locally.

## Goals

- User-triggered capture only.
- Keep image data on device.
- Support rectangle, arrow, text, and brush.
- Support undo, copy, and download.

## Architecture

- Browser surfaces live in `entrypoints/`.
- Reusable logic lives in `lib/`.
- Shared infrastructure comes from `@hub/shared`.

## Data and state

Capture data URL is stored in `chrome.storage.session` and removed after the annotate page loads. Tool preferences are stored locally.

## User flow

Popup calls `chrome.tabs.captureVisibleTab`; annotate page renders a canvas, collects operations, and exports locally.

## Permissions and APIs

`activeTab`, `storage`, `clipboardWrite`.

Primary APIs: `chrome.tabs.captureVisibleTab`, Canvas 2D, Clipboard API, session storage.

## Boundaries and edge cases

- Capture occurs only from the popup user gesture.
- No screenshot upload.
- Undo is local and memory-based.
- Cross-origin tab content is captured as pixels by the browser.

## Verification

Annotation settings and operation creation are unit tested.

See also:

- [`extensions/screenshot-annotator/README.md`](../../extensions/screenshot-annotator/README.md)
- [`extensions/screenshot-annotator/PLUGIN.md`](../../extensions/screenshot-annotator/PLUGIN.md)
- [`docs/qa/screenshot-annotator.md`](../../docs/qa/screenshot-annotator.md)
