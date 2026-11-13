# Hub Template

## Scope

- Verify the template popup/background loop
- Verify typecheck/build pipeline

## Permissions

```text
storage
```

See [`docs/listings/_template/permissions.md`](../../docs/listings/_template/permissions.md).

## Message contract

Messages are declared in `lib/messages.ts` where applicable. Entry points must not invent string message shapes.

## Manual verification

See [`docs/qa/_template.md`](../../docs/qa/_template.md).

## Known constraints

- Manifest V3 only.
- No analytics, accounts, or telemetry.
- Runtime page features use activeTab/runtime injection where possible.
