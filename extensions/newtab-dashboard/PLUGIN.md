# New Tab Dashboard Lite

## Scope

- Local dashboard
- Todos and shortcuts
- No search override

## Permissions

```text
storage
```

See [`docs/listings/newtab-dashboard/permissions.md`](../../docs/listings/newtab-dashboard/permissions.md).

## Message contract

Messages are declared in `lib/messages.ts` where applicable. Entry points must not invent string message shapes.

## Manual verification

See [`docs/qa/newtab-dashboard.md`](../../docs/qa/newtab-dashboard.md).

## Known constraints

- Manifest V3 only.
- No analytics, accounts, or telemetry.
- Runtime page features use activeTab/runtime injection where possible.
