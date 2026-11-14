# Hub Template

A minimal, production-shaped WXT starter for new plugins.

## Features

- Expose the standard popup/background message loop.
- Demonstrate typed message contracts and namespaced storage.
- Keep the new-plugin checklist short and predictable.

## How it works

Popup sends `TEMPLATE_PING` to background; background responds with a timestamp.

## Permissions

`storage` is available for derived templates. The template itself does not read page content.

## Data model

`template.settings` is intentionally omitted; the template does not persist data.

## Limitations

- Do not add broad host permissions to the template.
- Keep it buildable in Chrome and Firefox.
- Use it as the source for new plugins, then customize permissions and contracts.

## Development

```bash
pnpm --filter "@hub/_template" dev
pnpm --filter "@hub/_template" build:chrome
pnpm --filter "@hub/_template" build:firefox
```

Load `extensions/_template/dist/chrome-mv3` in Chromium for local testing.

## Design and QA

- Detailed design: [`docs/design/plugins/_template.md`](../../docs/design/plugins/_template.md)
- QA checklist: [`docs/qa/_template.md`](../../docs/qa/_template.md)
- Store listing: [`docs/listings/_template`](../../docs/listings/_template)
