# Reading Progress Lite

Show a per-site reading progress indicator on long pages.

## Features

- Use rAF-throttled scroll updates.
- Remember color, height, position, and offsets.
- Avoid network requests.

## How it works

Popup injects content script; content script listens to scroll/resize and updates a fixed bar.

## Permissions

`activeTab`, `scripting`, `storage`.

## Configuration

Enable state and color are always visible. Height, position, and offsets are in **Advanced appearance**.

## Data model

`reading-progress.settings.sites[origin]` stores enabled state and style settings.

## Limitations

- No page content is read or transmitted.
- Top/bottom offsets help avoid fixed headers/footers.
- Only main frame is targeted.

## Development

```bash
pnpm --filter "@hub/reading-progress" dev
pnpm --filter "@hub/reading-progress" build:chrome
pnpm --filter "@hub/reading-progress" build:firefox
```

Load `extensions/reading-progress/dist/chrome-mv3` in Chromium for local testing.

## Design and QA

- Detailed design: [`docs/design/plugins/reading-progress.md`](../../docs/design/plugins/reading-progress.md)
- QA checklist: [`docs/qa/reading-progress.md`](../../docs/qa/reading-progress.md)
- Store listing: [`docs/listings/reading-progress`](../../docs/listings/reading-progress)
