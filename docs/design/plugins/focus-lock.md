# Focus Lock design

## Purpose

Block distracting domains locally and provide explicit temporary unlock paths.

## Goals

- Use DNR instead of page scripts.
- Support per-domain unlock.
- Store passwords only as PBKDF2 hash and salt.
- Support domain import/export.

## Architecture

- Browser surfaces live in `entrypoints/`.
- Reusable logic lives in `lib/`.
- Shared infrastructure comes from `@hub/shared`.

## Data and state

`focus-lock.settings` stores domains, unlock timestamps, password hash/salt, failed attempts, and lockout timestamp.

## User flow

Options updates domains; background syncs one DNR rule per locked domain and redirects main-frame requests to `/blocked.html?domain=<domain>`.

## Permissions and APIs

`declarativeNetRequest`, `storage`, `alarms`.

Primary APIs: DNR dynamic rules, PBKDF2 WebCrypto, alarms, storage.

## Boundaries and edge cases

- No browsing history is stored.
- Password cannot be recovered.
- Five failed attempts trigger a five-minute lockout.
- DNR rule sync failures are retried on startup/update.

## Verification

Domain normalization/import, DNR helpers, password hashing, and settings validation are unit tested.

See also:

- [`extensions/focus-lock/README.md`](../../extensions/focus-lock/README.md)
- [`extensions/focus-lock/PLUGIN.md`](../../extensions/focus-lock/PLUGIN.md)
- [`docs/qa/focus-lock.md`](../../docs/qa/focus-lock.md)
