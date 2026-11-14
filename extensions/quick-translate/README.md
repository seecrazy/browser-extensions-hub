# Quick Translate

Translate selected text on a website without installing a full-page translation extension.

## Use case

Use this when you occasionally need a word, phrase, or paragraph translated while reading a web page. It avoids broad page access by activating only the current tab.

## How to use

1. Open a normal `http` or `https` website.
2. Click the Quick Translate toolbar icon.
3. Choose the target language.
4. Click **Activate**.
5. Select text on the page. A small bubble shows the translation.

Press `Escape` to close the bubble.

## Scope and limitations

- No page access by default. Activation grants access to the current tab only.
- Access does not apply to other tabs or future browsing sessions.
- Browser pages such as `chrome://new-tab-page`, `chrome://settings`, the Chrome Web Store, and other internal pages cannot be activated. This is a browser security restriction.
- Does not translate entire pages, PDFs, or editable input fields.
- Selected text is sent to Google Translate for translation. No extension analytics or account data is collected.

## Development

```bash
pnpm --filter "@hub/quick-translate" dev
pnpm --filter "@hub/quick-translate" build:chrome
```

Load `extensions/quick-translate/dist/chrome-mv3` in Chromium for local testing.
