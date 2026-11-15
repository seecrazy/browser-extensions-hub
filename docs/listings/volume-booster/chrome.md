# Volume Booster Lite — Chrome Web Store listing

## Name

Volume Booster Lite

## Short description

Boost media volume in the current tab up to 300%.

## Detailed description

Volume Booster Lite controls media elements in the current tab using the standard volume API and Web Audio gain. It remembers per-site levels locally and clearly marks cross-origin media that cannot safely exceed 100%.

## Single purpose

Adjust the volume of media elements in the current tab.

## Permission justifications

- `activeTab`: activeTab grants access only after the user opens the extension popup.
- `scripting`: scripting injects the controller that applies the chosen gain to video and audio elements.
- `storage`: storage keeps per-site volume preferences on this device.
