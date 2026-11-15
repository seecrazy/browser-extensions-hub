# Font Switcher Lite

Switch the current page to a locally installed Kai, Xingkai, Song, Hei, or
FangSong font without changing page content or sending anything over the
network.

## Use case

Use this when a website's typography is hard to read and your operating system
already has the CJK font you prefer.

## How to use

1. Open a normal `http` or `https` website.
2. Click the Font Switcher toolbar icon.
3. Hover a font to preview it in the popup.
4. Click a font to apply it to the current page.
5. Click **Use page default** to remove the override.
6. Open options to change the default font or clear preferences.

## Features

- No font files are bundled or downloaded.
- Only locally installed system fonts are used.
- Font fallback is built into stable `@font-face` aliases.
- Per-origin and default preferences remain local.
- Popup availability hints show whether a style can render directly.

## Limitations

- Browser pages such as `chrome://new-tab-page` and the Chrome Web Store cannot
  be activated.
- New tabs require popup activation because the plugin does not request broad
  host permissions.
- Some sites use their own `!important` typography and may resist overrides.
- Xingkai and some FangSong variants are not preinstalled on every operating
  system; CSS falls back to the closest installed font.

## Development

```bash
pnpm --filter "@hub/font-switcher" dev
pnpm --filter "@hub/font-switcher" build:chrome
pnpm --filter "@hub/font-switcher" build:firefox
```

Load `extensions/font-switcher/dist/chrome-mv3` in Chromium for local testing.

## Design and QA

- Detailed design: [`docs/design/plugins/font-switcher.md`](../../docs/design/plugins/font-switcher.md)
- QA checklist: [`docs/qa/font-switcher.md`](../../docs/qa/font-switcher.md)
- Store listing: [`docs/listings/font-switcher`](../../docs/listings/font-switcher)
