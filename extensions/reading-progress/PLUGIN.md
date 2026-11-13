# Reading Progress Lite

## Scope

- Per-site progress bar
- color/height/position/offset

## Permissions

```text
activeTab, scripting, storage
```

See [`docs/listings/reading-progress/permissions.md`](../../docs/listings/reading-progress/permissions.md).

## Message contract

Messages are declared in `lib/messages.ts` where applicable. Entry points must not invent string message shapes.

## Manual verification

See [`docs/qa/reading-progress.md`](../../docs/qa/reading-progress.md).

## Known constraints

- Manifest V3 only.
- No analytics, accounts, or telemetry.
- Runtime page features use activeTab/runtime injection where possible.
