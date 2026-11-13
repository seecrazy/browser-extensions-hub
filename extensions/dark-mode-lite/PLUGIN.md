# Dark Mode Lite

## Scope

- Per-site CSS dark mode
- Strength and reload behavior

## Permissions

```text
activeTab, scripting, storage
```

See [`docs/listings/dark-mode-lite/permissions.md`](../../docs/listings/dark-mode-lite/permissions.md).

## Message contract

Messages are declared in `lib/messages.ts` where applicable. Entry points must not invent string message shapes.

## Manual verification

See [`docs/qa/dark-mode-lite.md`](../../docs/qa/dark-mode-lite.md).

## Known constraints

- Manifest V3 only.
- No analytics, accounts, or telemetry.
- Runtime page features use activeTab/runtime injection where possible.
