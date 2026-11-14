# Volume Booster Lite design

## Purpose

Increase media volume in the current tab up to 300% using Web Audio.

## Goals

- Use `MediaElementAudioSourceNode -> GainNode -> destination` above 100%.
- Keep per-site volume.
- Handle dynamically inserted media.
- Clearly report unsupported cross-origin media.

## Architecture

- Browser surfaces live in `entrypoints/`.
- Reusable logic lives in `lib/`.
- Shared infrastructure comes from `@hub/shared`.

## Data and state

`volume-booster.settings.sites[origin]` stores `{ level }`.

## User flow

Popup injects the content script, queries media state, and sends volume updates.

## Permissions and APIs

`activeTab`, `scripting`, `storage`.

Primary APIs: Web Audio API, MutationObserver, runtime messages, `chrome.storage.local`.

## Boundaries and edge cases

- Non-CORS cross-origin media cannot be safely boosted above 100%; the plugin avoids creating a silent Web Audio graph.
- AudioContext may be suspended until the page receives user interaction.
- Only main-frame media are targeted.

## Verification

Level and per-site state helpers are unit tested.

See also:

- [`extensions/volume-booster/README.md`](../../extensions/volume-booster/README.md)
- [`extensions/volume-booster/PLUGIN.md`](../../extensions/volume-booster/PLUGIN.md)
- [`docs/qa/volume-booster.md`](../../docs/qa/volume-booster.md)
