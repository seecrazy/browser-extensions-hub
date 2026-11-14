# New Tab Dashboard Lite

Provide a local dashboard without taking over search.

## Features

- Respect browser search settings.
- Keep todos and shortcuts local.
- Sanitize every shortcut URL.
- Keep the UI responsive and local.

## How it works

New tab page renders time/date, todos, and shortcut links; UI patches namespaced storage.

## Permissions

`storage`.

## Data model

`newtab-dashboard.settings` stores todos and shortcuts.

## Limitations

- No search box, no search API, no search-settings modification.
- Only http(s) shortcuts are accepted.
- No remote content or ads.

## Development

```bash
pnpm --filter "@hub/newtab-dashboard" dev
pnpm --filter "@hub/newtab-dashboard" build:chrome
pnpm --filter "@hub/newtab-dashboard" build:firefox
```

Load `extensions/newtab-dashboard/dist/chrome-mv3` in Chromium for local testing.

## Design and QA

- Detailed design: [`docs/design/plugins/newtab-dashboard.md`](../../docs/design/plugins/newtab-dashboard.md)
- QA checklist: [`docs/qa/newtab-dashboard.md`](../../docs/qa/newtab-dashboard.md)
- Store listing: [`docs/listings/newtab-dashboard`](../../docs/listings/newtab-dashboard)
