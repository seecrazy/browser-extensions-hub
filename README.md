# Browser Extensions Hub

[![CI](https://github.com/seecrazy/browser-extensions-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/seecrazy/browser-extensions-hub/actions/workflows/ci.yml)
[![CodeQL](https://github.com/seecrazy/browser-extensions-hub/actions/workflows/codeql.yml/badge.svg)](https://github.com/seecrazy/browser-extensions-hub/actions/workflows/codeql.yml)

A privacy-first browser-extension monorepo built with **pnpm workspaces**, **WXT**, and **TypeScript**. It contains one reusable template and ten independently buildable, independently releasable Manifest V3 plugins for Chrome and Firefox.

## Highlights

- **MV3 only** — Chrome MV3 and Firefox 142+ builds.
- **Local-first** — no accounts, telemetry, cloud sync, ads, or data selling.
- **Minimum permissions** — broad host permissions and `clipboardRead` are rejected.
- **Independent plugins** — no cross-plugin dependencies; shared code stays in `@hub/shared`.
- **Artifact-first validation** — manifest checks inspect generated WXT output, not source claims.
- **Typed contracts** — messages, settings, and release tags are checked.
- **Store-ready workflow** — manifest validation, Firefox lint, dependency audit, QA checklists, release artifacts, and checksums.

## Plugin catalog

| Plugin                                                            | Focus                                                    | Entrypoints                               | Permissions                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| [Template](extensions/_template/PLUGIN.md)                        | Starter for new plugins                                  | popup, background                         | `storage`                                                  |
| [Dark Mode Lite](extensions/dark-mode-lite/PLUGIN.md)             | Per-site dark mode and strength                          | popup, runtime content script             | `activeTab`, `scripting`, `storage`                        |
| [Tab Stash](extensions/tab-stash/PLUGIN.md)                       | Named tab groups, search, restore, JSON backup           | popup, background, options                | `tabs`, `storage`                                          |
| [Volume Booster](extensions/volume-booster/PLUGIN.md)             | Up to 300% Web Audio gain, dynamic media                 | popup, runtime content script             | `activeTab`, `scripting`, `storage`                        |
| [Quick Translate](extensions/quick-translate/PLUGIN.md)           | Selection bubble, cache, timeout, copy, RTL              | popup, background, runtime content script | `activeTab`, `scripting`, `storage`, Google Translate host |
| [Focus Lock](extensions/focus-lock/PLUGIN.md)                     | Local DNR blocklist and per-domain unlock                | background, options, blocked page         | `declarativeNetRequest`, `storage`, `alarms`               |
| [New Tab Dashboard](extensions/newtab-dashboard/PLUGIN.md)        | Local time, todos, shortcuts; no search override         | newtab, background                        | `storage`                                                  |
| [Privacy Cleaner](extensions/privacy-cleaner/PLUGIN.md)           | Manual per-origin storage cleanup                        | popup, background, options                | `activeTab`, `browsingData`, `storage`                     |
| [Reading Progress](extensions/reading-progress/PLUGIN.md)         | Per-site progress bar with offset controls               | popup, runtime content script             | `activeTab`, `scripting`, `storage`                        |
| [Clipboard History](extensions/clipboard-history-lite/PLUGIN.md)  | Last 50 explicit copies with expiry and site controls    | popup, runtime content script             | `activeTab`, `scripting`, `storage`, `clipboardWrite`      |
| [Screenshot Annotator](extensions/screenshot-annotator/PLUGIN.md) | Local capture plus rectangle/arrow/text/brush annotation | popup, annotate, background               | `activeTab`, `storage`, `clipboardWrite`                   |

Each plugin has a local `PLUGIN.md` with scope, permissions, constraints, and QA references.

## Architecture

```text
extensions/<plugin>/
├── entrypoints/          Browser surfaces: popup, background, content, options, pages
├── lib/                  Plugin-local types, settings, contracts, and pure logic
├── public/               Static assets and icons
└── PLUGIN.md             Scope, permissions, QA, constraints

packages/
├── shared/               Contract messaging, namespaced storage, injection, shared UI
├── eslint-config/         Shared ESLint configuration
└── tsconfig/              Shared TypeScript configuration
```

`@hub/shared` is bundled into each extension by WXT. Published extensions do not depend on npm at runtime.

## Requirements

- Node.js `22.12.0`
- pnpm `9.15.9`
- Chromium-based browser and/or Firefox 142+

## Quick start

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install
pnpm build
```

Build one target:

```bash
pnpm build:chrome
pnpm build:firefox
```

Build one plugin:

```bash
pnpm --filter @hub/dark-mode-lite build:chrome
pnpm --filter @hub/dark-mode-lite build:firefox
```

Run one plugin in development:

```bash
pnpm --filter @hub/dark-mode-lite dev
pnpm --filter @hub/newtab-dashboard dev
```

## Quality gates

Run the main suite:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm validate:manifests
pnpm validate:store-readiness --allow-incomplete
pnpm audit --prod
```

Useful validation variants:

```bash
pnpm validate:manifests --plugin dark-mode-lite --browser firefox
pnpm validate:store-readiness --plugin dark-mode-lite --browser chrome --allow-incomplete
```

The store-readiness check currently uses `--allow-incomplete` because real screenshots are still pending. Without that flag, unchecked screenshot items fail validation.

## Testing

| Command                                                                    | Scope                                       |
| -------------------------------------------------------------------------- | ------------------------------------------- |
| `pnpm test`                                                                | Fast unit tests for shared and plugin logic |
| `pnpm test:coverage`                                                       | Unit tests with V8 coverage                 |
| `pnpm exec web-ext lint --source-dir extensions/<plugin>/dist/firefox-mv3` | Firefox add-on lint                         |
| `pnpm test:e2e`                                                            | Playwright browser-level smoke tests        |

E2E tests require a Chromium browser:

```bash
pnpm build
pnpm test:e2e:install
pnpm test:e2e
```

On Linux CI, run E2E under Xvfb:

```bash
xvfb-run --auto-servernum pnpm test:e2e
```

## Local loading

### Chromium

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Load `extensions/<plugin>/dist/chrome-mv3`.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose **Load Temporary Add-on**.
3. Select `extensions/<plugin>/dist/firefox-mv3/manifest.json`.

## Add a plugin

```bash
cp -R extensions/_template extensions/my-plugin
```

Then:

1. Change `package.json` to `@hub/my-plugin`.
2. Update `wxt.config.ts` with real name, description, permissions, Firefox gecko id, and data-collection declaration.
3. Add plugin-local types, settings, and message contracts under `lib/`.
4. Add `PLUGIN.md`.
5. Add Chrome/Firefox listing, privacy, permissions, and screenshot docs under `docs/listings/my-plugin/`.
6. Add `docs/qa/my-plugin.md`.
7. Run `pnpm install`.
8. Pass all quality gates.

Manifest validation discovers plugin directories automatically.

## Release

Tag format:

```text
<plugin-name>@<version>
```

Example:

```bash
pnpm validate:release-tag dark-mode-lite@0.1.0
git tag dark-mode-lite@0.1.0
git push origin dark-mode-lite@0.1.0
```

The release workflow:

1. validates tag, directory, package name, and version;
2. builds Chrome MV3 and Firefox MV3;
3. validates and lints the selected plugin;
4. packs Chrome zip, Firefox zip, Firefox source zip, and `SHA256SUMS`;
5. uploads a Chrome draft when Chrome secrets are present;
6. signs Firefox from downloaded artifacts when AMO secrets are present;
7. creates a GitHub Release with signed Firefox artifacts when available.

Publish jobs use protected GitHub environments:

- `chrome-publish`
- `firefox-publish`

See [`docs/operations/release-checklist.md`](docs/operations/release-checklist.md).

## Current status

### Done

- Ten plugins covering NTP, content scripts, background workers, options pages, DNR, media, clipboard, and canvas workflows.
- Chrome MV3 and Firefox MV3 builds.
- Shared messaging, storage, injection, and UI helpers.
- Unit tests, coverage, lint, format, Firefox lint, dependency audit, and dependency review.
- Manifest and store-readiness validators.
- Release artifacts, source archive, signing flow, checksums, and smoke checks.
- Per-plugin documentation and QA checklists.

### Not done yet

- Real store screenshots.
- Final product/design review of generated icons.
- Full manual browser QA for every plugin.
- Real Google Translate endpoint verification.
- Chrome Web Store and AMO submissions.
- Plugin-specific release notes.

## Privacy and compliance

- No analytics, accounts, telemetry, advertising, cloud storage, or data selling.
- Plugin settings and stashes remain local.
- Page-level features use `activeTab` and runtime injection rather than broad host permissions.
- New Tab Dashboard does not override search settings and has no search box.
- Privacy Cleaner only performs user-triggered per-origin cleanup.
- Clipboard History does not request `clipboardRead`; it records only explicit `copy` events.
- Screenshot Annotator clears session screenshot data after loading it.
- Quick Translate sends selected text to Google Translate for translation; this is disclosed in its listing and privacy docs.
- Quick Translate never grants page access by default; tab, site, and all-site access are explicit user choices.

## Documentation

- Design: [`docs/design/browser-extensions-hub.md`](docs/design/browser-extensions-hub.md)
- ADRs: [`docs/design/adr`](docs/design/adr)
- Roadmap: [`docs/roadmap.md`](docs/roadmap.md)
- Handoff: [`HANDOFF.md`](HANDOFF.md)
- Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Security: [`SECURITY.md`](SECURITY.md)
- Store listings: [`docs/listings`](docs/listings)
- QA checklists: [`docs/qa`](docs/qa)
- Release checklist: [`docs/operations/release-checklist.md`](docs/operations/release-checklist.md)

## License

See [`LICENSE`](LICENSE).
