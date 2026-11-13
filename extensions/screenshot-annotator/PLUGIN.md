# Screenshot Annotator Lite

## Scope

- Local screenshot annotation
- rectangle/arrow/text/brush
- copy/download

## Permissions

```text
activeTab, storage, clipboardWrite
```

See [`docs/listings/screenshot-annotator/permissions.md`](../../docs/listings/screenshot-annotator/permissions.md).

## Message contract

Messages are declared in `lib/messages.ts` where applicable. Entry points must not invent string message shapes.

## Manual verification

See [`docs/qa/screenshot-annotator.md`](../../docs/qa/screenshot-annotator.md).

## Known constraints

- Manifest V3 only.
- No analytics, accounts, or telemetry.
- Runtime page features use activeTab/runtime injection where possible.
