# Privacy Cleaner Lite

## Scope

- Manual per-origin cleanup
- Selected data types

## Permissions

```text
activeTab, browsingData, storage
```

See [`docs/listings/privacy-cleaner/permissions.md`](../../docs/listings/privacy-cleaner/permissions.md).

## Message contract

Messages are declared in `lib/messages.ts` where applicable. Entry points must not invent string message shapes.

## Manual verification

See [`docs/qa/privacy-cleaner.md`](../../docs/qa/privacy-cleaner.md).

## Known constraints

- Manifest V3 only.
- No analytics, accounts, or telemetry.
- Runtime page features use activeTab/runtime injection where possible.
