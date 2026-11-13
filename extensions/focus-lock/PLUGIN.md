# Focus Lock

## Scope

- DNR blocklist
- per-domain unlock
- local password

## Permissions

```text
declarativeNetRequest, storage, alarms
```

See [`docs/listings/focus-lock/permissions.md`](../../docs/listings/focus-lock/permissions.md).

## Message contract

Messages are declared in `lib/messages.ts` where applicable. Entry points must not invent string message shapes.

## Manual verification

See [`docs/qa/focus-lock.md`](../../docs/qa/focus-lock.md).

## Known constraints

- Manifest V3 only.
- No analytics, accounts, or telemetry.
- Runtime page features use activeTab/runtime injection where possible.
