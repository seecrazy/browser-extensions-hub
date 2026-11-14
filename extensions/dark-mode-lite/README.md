# Dark Mode Lite

Apply a lightweight CSS dark mode to one origin without broad host access.

## Features

- Provide immediate visual feedback.
- Remember per-site enabled state and strength.
- Avoid modifying page DOM beyond a style element.
- Keep activeTab-based injection; page reload requires reactivation.

## How it works

Popup injects `/content-scripts/dark-mode.js`; content script reads/writes per-site state and applies an inline CSS style.

## Permissions

`activeTab`, `scripting`, `storage`.

## Data model

`dark-mode-lite.settings.sites[origin]` stores `{ enabled, strength }`.

## Limitations

- No broad host permissions.
- Does not alter site data or network traffic.
- CSS inversion can affect pages that already control colors aggressively.
- Images, video, canvas, SVG, and iframes receive inverse compensation.

## Development

```bash
pnpm --filter "@hub/dark-mode-lite" dev
pnpm --filter "@hub/dark-mode-lite" build:chrome
pnpm --filter "@hub/dark-mode-lite" build:firefox
```

Load `extensions/dark-mode-lite/dist/chrome-mv3` in Chromium for local testing.

## Design and QA

- Detailed design: [`docs/design/plugins/dark-mode-lite.md`](../../docs/design/plugins/dark-mode-lite.md)
- QA checklist: [`docs/qa/dark-mode-lite.md`](../../docs/qa/dark-mode-lite.md)
- Store listing: [`docs/listings/dark-mode-lite`](../../docs/listings/dark-mode-lite)
