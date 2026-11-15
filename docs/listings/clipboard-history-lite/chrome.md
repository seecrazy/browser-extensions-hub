# Clipboard History Lite — Chrome Web Store listing

## Name

Clipboard History Lite

## Short description

Keep your last 50 explicit copies locally.

## Detailed description

Clipboard History Lite saves text only when you actively copy it on an enabled tab. You can search, copy, delete, or clear local history. It does not read the clipboard API, monitor keystrokes, or upload copied content.

## Single purpose

Keep a local history of text the user explicitly copies.

## Permission justifications

- `activeTab`: activeTab grants access only after the user clicks Enable on this tab.
- `scripting`: scripting injects the copy listener into the tab the user explicitly enables.
- `storage`: storage keeps copied text and disabled-origin preferences on this device.
- `clipboardWrite`: clipboardWrite writes a selected history item back to the clipboard when the user clicks Copy.
