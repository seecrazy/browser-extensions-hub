# UI Direction 0002: Progressive Settings Disclosure

## Status

Superseded by [0003 Chrome-native interface](./0003-chrome-native-interface.md)

## Context

Plugin configuration surfaces can become crowded. Showing every control upfront increases cognitive load, especially in popups where users usually need only one or two actions.

## Decision

Use a shared progressive-disclosure pattern:

- Show only essential controls by default.
- Group low-frequency or technical controls in an **Advanced settings** disclosure.
- Use a native `<details>` element for keyboard, screen-reader, and no-JS fallback behavior.
- Keep the expanded state local to the page; it does not persist until a user changes a setting.

## Consequences

- Popups stay compact.
- Power users still have access to technical settings.
- Plugin pages use the same visual and interaction language.
- Shared component lives in `@hub/shared/ui`.

## Applied surfaces

- Quick Translate: language, timeout, one-tab access, and all-site controls. Base surface only shows the current-site toggle.
- Reading Progress: height, position, and offsets.
- Clipboard History: retention window.

## Refinement

Quick Translate follows a stricter base-first model. Its base surface only shows the current site and a single site enable/disable control. Language, timeout, one-tab activation, all-site access, and revocation controls are grouped behind **Advanced settings**.

For all-site mode, the base control becomes a per-site exception: it disables the current origin without revoking all-site access. Clicking it again removes the exception.
