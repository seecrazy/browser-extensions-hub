# UI Direction 0002: Progressive Settings Disclosure

## Status

Accepted

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

- Quick Translate: request timeout.
- Reading Progress: height, position, and offsets.
- Clipboard History: retention window.
