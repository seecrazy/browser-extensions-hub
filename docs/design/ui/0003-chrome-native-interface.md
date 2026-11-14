# UI Direction 0003: Chrome-native interface

## Status

Accepted

Supersedes:

- [0001 Editorial Interface System](./0001-editorial-interface-system.md)
- [0002 Advanced Settings Disclosure](./0002-advanced-settings-disclosure.md)

## Context

The plugins have reached a stable core feature set. Their visual language should now match Chrome itself instead of introducing a separate editorial identity. This reduces cognitive load and makes extension pages feel like part of the browser.

## Decision

Use a shared Chrome-like design system for all extension surfaces:

- System Google/Chrome typography (`Google Sans Text`, `Google Sans`, `Roboto`, then system fallbacks).
- Chrome light and dark theme tokens.
- White cards on a neutral Chrome surface.
- 1px gray outlines with subtle elevation.
- 12px / 8px rounded corners.
- Filled blue primary actions and tonal secondary actions.
- Restrained transitions and no decorative textures.
- Native form controls styled to match Chrome's settings pages.
- Advanced-settings disclosure behavior remains available.

All plugins keep their existing core behavior. This is a presentation-layer change only.

## Consequences

- Extension popups, options pages, blocked pages, and the dashboard use one visual language.
- UI no longer bundles custom display fonts.
- Future plugin pages can rely on the shared `hub-*` design tokens.
