# Font Switcher Lite

## Scope

- Switch locally installed Kai, Xingkai, Song, Hei, and FangSong fonts.
- Per-origin local preference.
- Default font preference.
- No bundled or remote font files.

## Permissions

```text
activeTab, scripting, storage
```

See [`docs/listings/font-switcher/permissions.md`](../../docs/listings/font-switcher/permissions.md).

## Message contract

Messages are declared in `lib/messages.ts`. Entry points must not invent string
message shapes.

## Manual verification

See [`docs/qa/font-switcher.md`](../../docs/qa/font-switcher.md).

## Known constraints

- Manifest V3 only.
- No analytics, accounts, telemetry, or remote requests.
- New tabs require popup activation because there are no broad host permissions.
- Unavailable system fonts fall back; fonts are not downloaded.
