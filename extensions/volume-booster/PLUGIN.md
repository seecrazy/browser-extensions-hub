# Volume Booster Lite

## Scope

- Current tab media gain
- Per-site volume and CORS limits

## Permissions

```text
activeTab, scripting, storage
```

See [`docs/listings/volume-booster/permissions.md`](../../docs/listings/volume-booster/permissions.md).

## Message contract

Messages are declared in `lib/messages.ts` where applicable. Entry points must not invent string message shapes.

## Manual verification

See [`docs/qa/volume-booster.md`](../../docs/qa/volume-booster.md).

## Known constraints

- Manifest V3 only.
- No analytics, accounts, or telemetry.
- Runtime page features use activeTab/runtime injection where possible.
