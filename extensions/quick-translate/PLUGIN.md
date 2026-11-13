# Quick Translate

## Scope

- Selection bubble translation
- Timeout, cache, copy, RTL

## Permissions

```text
activeTab, scripting, storage; https://translate.googleapis.com/*
```

See [`docs/listings/quick-translate/permissions.md`](../../docs/listings/quick-translate/permissions.md).

## Message contract

Messages are declared in `lib/messages.ts` where applicable. Entry points must not invent string message shapes.

## Manual verification

See [`docs/qa/quick-translate.md`](../../docs/qa/quick-translate.md).

## Known constraints

- Manifest V3 only.
- No analytics, accounts, or telemetry.
- Runtime page features use activeTab/runtime injection where possible.
