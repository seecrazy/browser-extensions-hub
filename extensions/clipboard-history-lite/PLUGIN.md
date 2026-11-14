# Clipboard History Lite

## Scope

- Local explicit copy history
- per-site disable

## Permissions

```text
activeTab, scripting, storage, clipboardWrite
```

See [`docs/listings/clipboard-history-lite/permissions.md`](../../docs/listings/clipboard-history-lite/permissions.md).

## Message contract

Messages are declared in `lib/messages.ts` where applicable. Entry points must not invent string message shapes.

## Manual verification

See [`docs/qa/clipboard-history-lite.md`](../../docs/qa/clipboard-history-lite.md).

## Known constraints

- Manifest V3 only.
- No analytics, accounts, or telemetry.
- Runtime page features use activeTab/runtime injection where possible.
