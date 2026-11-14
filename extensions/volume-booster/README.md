# Volume Booster Lite

Increase media volume in the current tab up to 300% using Web Audio.

## Features

- Use `MediaElementAudioSourceNode -> GainNode -> destination` above 100%.
- Keep per-site volume.
- Handle dynamically inserted media.
- Clearly report unsupported cross-origin media.

## How it works

Popup injects the content script, queries media state, and sends volume updates.

## Permissions

`activeTab`, `scripting`, `storage`.

## Data model

`volume-booster.settings.sites[origin]` stores `{ level }`.

## Limitations

- Non-CORS cross-origin media cannot be safely boosted above 100%; the plugin avoids creating a silent Web Audio graph.
- AudioContext may be suspended until the page receives user interaction.
- Only main-frame media are targeted.

## Development

```bash
pnpm --filter "@hub/volume-booster" dev
pnpm --filter "@hub/volume-booster" build:chrome
pnpm --filter "@hub/volume-booster" build:firefox
```

Load `extensions/volume-booster/dist/chrome-mv3` in Chromium for local testing.

## Design and QA

- Detailed design: [`docs/design/plugins/volume-booster.md`](../../docs/design/plugins/volume-booster.md)
- QA checklist: [`docs/qa/volume-booster.md`](../../docs/qa/volume-booster.md)
- Store listing: [`docs/listings/volume-booster`](../../docs/listings/volume-booster)
