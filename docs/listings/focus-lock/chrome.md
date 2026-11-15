# Focus Lock — Chrome Web Store listing

## Name

Focus Lock

## Short description

Block distracting sites locally.

## Detailed description

Focus Lock uses Manifest V3 declarativeNetRequest rules to redirect blacklisted domains to a local blocked page. You can unlock one domain for five minutes with a password, or wait sixty seconds when no password is set. Everything stays on your device.

## Single purpose

Block distracting domains selected by the user.

## Permission justifications

- `declarativeNetRequest`: declarativeNetRequest enforces the user's local blocklist by redirecting blocked domains to the extension's blocked page.
- `storage`: storage keeps the blocklist, password hash, and unlock state on this device.
- `alarms`: alarms expire temporary domain unlocks on schedule.
