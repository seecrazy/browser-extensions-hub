# Hub Template design

## Purpose

A minimal, production-shaped WXT starter for new plugins.

## Goals

- Expose the standard popup/background message loop.
- Demonstrate typed message contracts and namespaced storage.
- Keep the new-plugin checklist short and predictable.

## Architecture

- Browser surfaces live in `entrypoints/`.
- Reusable logic lives in `lib/`.
- Shared infrastructure comes from `@hub/shared`.

## Data and state

`template.settings` is intentionally omitted; the template does not persist data.

## User flow

Popup sends `TEMPLATE_PING` to background; background responds with a timestamp.

## Permissions and APIs

`storage` is available for derived templates. The template itself does not read page content.

Primary APIs: WXT entrypoints, `chrome.runtime.sendMessage`, and `@hub/shared/messaging`.

## Boundaries and edge cases

- Do not add broad host permissions to the template.
- Keep it buildable in Chrome and Firefox.
- Use it as the source for new plugins, then customize permissions and contracts.

## Verification

Covered by repository-wide build, typecheck, manifest validation, and QA checklist.

See also:

- [`extensions/_template/README.md`](../../extensions/_template/README.md)
- [`extensions/_template/PLUGIN.md`](../../extensions/_template/PLUGIN.md)
- [`docs/qa/_template.md`](../../docs/qa/_template.md)
