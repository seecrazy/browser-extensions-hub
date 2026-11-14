# UI Direction 0001: Editorial Interface System

## Status

Superseded by [0003 Chrome-native interface](./0003-chrome-native-interface.md)

## Context

The current interface is functional but visually generic: dark neutral cards, system sans-serif, and soft gradients. It does not express the project's local-first, maker-led identity and can feel interchangeable with AI-generated tooling.

## Decision

Create an "editorial print shop" system used by all extension surfaces:

- **Fonts**: Bricolage Grotesque for display, Newsreader for body, Martian Mono for labels and data.
- **Palette**: warm paper base, heavy ink lines, signal orange for action, cobalt for system states, moss green for success, rust for destructive intent.
- **Depth**: hard offset shadows instead of diffuse glows.
- **Texture**: layered paper gradients, registration marks, and fine grid/crosshair patterns.
- **Motion**: one orchestrated load sequence with staggered cards, stamp-like headings, and tactile button feedback.
- **Accessibility**: visible focus rings, reduced-motion support, high contrast text, and semantic controls.

## Consequences

- Extension surfaces share recognizable typography and motion.
- The UI feels hand-set and editorial rather than generic dark-glass AI UI.
- New pages can inherit tokens from `@hub/shared/ui/styles.css`.
- Third-party frameworks remain unnecessary.
