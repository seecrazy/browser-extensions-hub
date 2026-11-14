# Tab Stash

Save tabs from the current window into local named groups, then restore them later.

## Features

- Write storage before closing tabs.
- Support one-tab and whole-group restore.
- Support search, rename, delete, import, and export.
- Avoid host permissions.

## How it works

Popup asks background to stash current-window tabs; background filters browser pages, persists a group, then closes the source tabs.

## Permissions

`tabs`, `storage`.

## Data model

`tab-stash.groups` stores an array of groups with stable group/tab ids. `tab-stash.settings` stores the pinned-tab preference.

## Limitations

- Chrome and extension pages are never stashed.
- Pinned tabs are skipped unless explicitly enabled.
- Restore can open many tabs; the UI confirms first.
- Imported URLs are sanitized and non-http(s) entries are dropped.

## Development

```bash
pnpm --filter "@hub/tab-stash" dev
pnpm --filter "@hub/tab-stash" build:chrome
pnpm --filter "@hub/tab-stash" build:firefox
```

Load `extensions/tab-stash/dist/chrome-mv3` in Chromium for local testing.

## Design and QA

- Detailed design: [`docs/design/plugins/tab-stash.md`](../../docs/design/plugins/tab-stash.md)
- QA checklist: [`docs/qa/tab-stash.md`](../../docs/qa/tab-stash.md)
- Store listing: [`docs/listings/tab-stash`](../../docs/listings/tab-stash)
