# Quick Translate — Chrome Web Store listing

## Name

Quick Translate

## Short description

Select text and get a quick translation.

## Detailed description

Quick Translate lets you enable translation for the current tab. Select text and a lightweight bubble shows the translation. It does not change your search settings, show ads, or collect analytics. Selected text is sent to Google Translate to produce the translation.

## Single purpose

Translate text selected on the current web page.

## Permission justifications

- `activeTab`: activeTab grants access only after the user clicks Enable on this tab.
- `scripting`: scripting injects the selection bubble into the tab the user explicitly enables.
- `storage`: storage remembers the user's target language preference on this device.
- `https://translate.googleapis.com/*`: This host permission lets the background service worker send selected text to Google Translate and return the translation.
- `https://clients5.google.com/*`: This host permission lets the background service worker use the Google Translate fallback endpoint when the primary endpoint is unavailable.
