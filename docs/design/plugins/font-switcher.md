# Font Switcher design

## Purpose

Switch a page to locally installed Kai, Xingkai, Song, Hei, or FangSong fonts
without modifying page content or sending data anywhere.

## Goals

- Preview each font in the popup before applying it.
- Apply a stable CSS class to the current page.
- Remember the user's default font and per-origin choice locally.
- Avoid packaging or downloading font files.
- Avoid broad host permissions.

## Non-goals

- No automatic background injection into every new website.
- No remote font downloads.
- No rich-text editor, PDF, or browser-UI font replacement.

## Architecture

- `entrypoints/popup/` activates the current tab, selects fonts, and shows
  availability.
- `entrypoints/font-switcher.content/` injects a style element and applies one
  body class.
- `entrypoints/options/` changes the default font, lists availability, and
  clears local preferences.
- Pure font-key and per-origin logic lives in `lib/`.

## Data and state

`font-switcher.settings` stores:

```ts
{
  schemaVersion: 1,
  defaultFont: FontKey,
  sites: Record<string, { enabled: boolean; fontKey: FontKey }>,
}
```

`FontKey` is one of `""`, `"kaiti"`, `"xingkai"`, `"songti"`, `"heiti"`, or
`"fangti"`. Empty key means "use the browser/site default" and disables the
font override.

## User flow

1. Open a normal `http` or `https` page.
2. Click the Font Switcher popup; popup injects the content script.
3. Hover a font for preview and click to apply it.
4. Choose **Default** to remove the override.
5. Change the default font or clear local preferences in options.

## Fonts and fallbacks

The plugin defines stable aliases:

| Alias              | Local fallbacks                                                  |
| ------------------ | ---------------------------------------------------------------- |
| `FontSwitcherKai`  | Kaiti SC, STKaiti, KaiTi, KaiTi_GB2312, SimKai                   |
| `FontSwitcherXing` | STXingkai, 华文行楷, Xingkai SC; falls back to Kai               |
| `FontSwitcherSong` | SimSun, Songti SC, STSong, NSimSun                               |
| `FontSwitcherHei`  | Microsoft YaHei, PingFang SC, Heiti SC, SimHei, Noto Sans CJK SC |
| `FontSwitcherFang` | FangSong, STFangsong, FangSong_GB2312                            |

Popup availability is a best-effort hint using `document.fonts.check`. A
missing local font remains selectable because CSS still has a useful fallback.

## Permissions and APIs

`activeTab`, `scripting`, `storage`.

Primary APIs: `chrome.scripting.executeScript`, `chrome.storage.local`, runtime
messages, CSS custom aliases, and `document.fonts.check`.

## Boundaries and edge cases

- Browser pages such as `chrome://` and the Chrome Web Store cannot be enabled.
- New tabs require popup activation because no broad host permission is used.
- Web pages with `!important` typography may partially resist CSS overrides.
- Iframe text inside the top-frame DOM inherits when applicable; separate
  cross-origin documents are not independently activated.
- `document.fonts.check` availability hints may be inaccurate across browsers;
  they do not block selection.

## Verification

Font-key normalization, defaults, per-origin patching, settings validation, and
message contracts are unit tested. Chrome/Firefox builds and generated manifests
are validated. A Playwright smoke test loads the popup and checks its core
controls.

See also:

- [`extensions/font-switcher/README.md`](../../extensions/font-switcher/README.md)
- [`extensions/font-switcher/PLUGIN.md`](../../extensions/font-switcher/PLUGIN.md)
- [`docs/qa/font-switcher.md`](../../docs/qa/font-switcher.md)
