# ADR 0016: Font Switcher Uses Local System Fonts and Active-Tab Access

## Status

Accepted

## Context

A font switcher must change page typography without shipping font files or
collecting page content. CJK system-font names differ across Windows, macOS,
and Office installs. Broad all-site access would make automatic background
application easier but conflicts with this repository's minimum-permission
policy and increases Chrome Web Store review risk.

## Decision

- Ship no font binaries. Define stable `@font-face` aliases using `local()`
  fallback chains for Kai, Xingkai, Song, Hei, and FangSong fonts.
- Apply fonts through runtime content-script injection with `activeTab` and
  `scripting`, consistent with other page-modifying plugins.
- Persist a user-selected default font and per-origin font choice locally.
- A selected font becomes active only after the user activates the current tab.
- If the requested system font is unavailable, CSS falls back to the closest
  bundled alias family and then to the generic serif/sans fallback.

## Consequences

- No remote requests, telemetry, font downloads, or broad host permissions.
- Installation permission prompts are smaller than the original all-URL design.
- New tabs require explicit popup activation because activeTab cannot grant
  silent all-site access.
- Rendering depends on locally installed system fonts; unavailable styles fall
  back instead of being downloaded.

## Release mapping

Chrome release automation resolves the extension id from
`FONT_SWITCHER_CHROME_EXTENSION_ID`.
