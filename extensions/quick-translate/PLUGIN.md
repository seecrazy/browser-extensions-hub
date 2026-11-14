# Quick Translate

## Scope

- Select text after activating the current tab.
- Show a lightweight translation bubble.
- Store only the target language locally.

## Permissions

```text
activeTab, scripting, storage; https://translate.googleapis.com/*
```

See [`docs/listings/quick-translate/permissions.md`](../../docs/listings/quick-translate/permissions.md).

## Manual verification

See [`docs/qa/quick-translate.md`](../../docs/qa/quick-translate.md).

## Known constraints

- Manifest V3 only.
- One-tab activation expires on navigation.
- No analytics, accounts, or telemetry.
