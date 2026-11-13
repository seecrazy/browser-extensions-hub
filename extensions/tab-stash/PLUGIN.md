# Tab Stash

## Scope

- Stash named groups
- Search, restore, import/export

## Permissions

```text
tabs, storage
```

See [`docs/listings/tab-stash/permissions.md`](../../docs/listings/tab-stash/permissions.md).

## Message contract

Messages are declared in `lib/messages.ts` where applicable. Entry points must not invent string message shapes.

## Manual verification

See [`docs/qa/tab-stash.md`](../../docs/qa/tab-stash.md).

## Known constraints

- Manifest V3 only.
- No analytics, accounts, or telemetry.
- Runtime page features use activeTab/runtime injection where possible.
