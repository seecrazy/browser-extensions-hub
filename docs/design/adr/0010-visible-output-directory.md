# ADR 0010: Use a visible `dist` output directory

## Status

Accepted

## Context

WXT's default `.output/chrome-mv3` and `.output/firefox-mv3` directories are hidden. On macOS, the Finder-based "Load unpacked" picker can hide dot-directories, making local loading awkward.

## Decision

Set WXT `outDir: "dist"` for every extension. Final paths become:

```text
extensions/<plugin>/dist/chrome-mv3
extensions/<plugin>/dist/firefox-mv3
```

All validators, CI jobs, release packaging, local loading docs, and E2E helpers use these visible paths.

## Consequences

- Contributors can select `dist/chrome-mv3` directly in Chrome.
- Release and validation paths no longer assume a hidden directory.
- Existing ignored `.output` directories may remain locally but are no longer used.
