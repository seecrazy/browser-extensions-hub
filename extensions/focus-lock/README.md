# Focus Lock

Block distracting domains locally and provide explicit temporary unlock paths.

## Features

- Use DNR instead of page scripts.
- Support per-domain unlock.
- Store passwords only as PBKDF2 hash and salt.
- Support domain import/export.

## How it works

Options updates domains; background syncs one DNR rule per locked domain and redirects main-frame requests to `/blocked.html?domain=<domain>`.

## Permissions

`declarativeNetRequest`, `storage`, `alarms`.

## Data model

`focus-lock.settings` stores domains, unlock timestamps, password hash/salt, failed attempts, and lockout timestamp.

## Limitations

- No browsing history is stored.
- Password cannot be recovered.
- Five failed attempts trigger a five-minute lockout.
- DNR rule sync failures are retried on startup/update.

## Development

```bash
pnpm --filter "@hub/focus-lock" dev
pnpm --filter "@hub/focus-lock" build:chrome
pnpm --filter "@hub/focus-lock" build:firefox
```

Load `extensions/focus-lock/dist/chrome-mv3` in Chromium for local testing.

## Design and QA

- Detailed design: [`docs/design/plugins/focus-lock.md`](../../docs/design/plugins/focus-lock.md)
- QA checklist: [`docs/qa/focus-lock.md`](../../docs/qa/focus-lock.md)
- Store listing: [`docs/listings/focus-lock`](../../docs/listings/focus-lock)
