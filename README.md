# Browser Extensions Hub

A `pnpm workspaces + WXT + TypeScript` monorepo for Manifest V3 browser extensions. The repository currently contains one reusable template and ten independently buildable, independently releasable plugins.

## Principles

- **MV3 first** — every extension targets Manifest V3.
- **Minimum permissions** — page-level features use `activeTab + scripting`; broad host permissions are rejected.
- **Independent plugins** — plugins do not depend on each other; shared code lives in `@hub/shared`.
- **Validate artifacts** — manifest checks inspect WXT output, not source declarations.
- **Local-first** — no accounts, cloud sync, or telemetry.
- **Typed contracts** — each plugin declares its message payload and response types once.

## Status

| Plugin          | Entrypoints                               | Current capability                                        |
| --------------- | ----------------------------------------- | --------------------------------------------------------- |
| Template        | popup, background                         | Minimal WXT starter with typed messages                   |
| Dark Mode Lite  | popup, runtime content script             | Per-site dark mode with strength control                  |
| Tab Stash       | popup, background, options                | Named groups, search, restore, JSON import/export         |
| Volume Booster  | popup, runtime content script             | Up to 300% Web Audio gain, dynamic media, per-site memory |
| Quick Translate | popup, background, runtime content script | Selection bubble, cache, timeout, copy, RTL support       |
| Focus Lock      | background, options, blocked page         | Local DNR blocklist, per-domain unlock, import/export     |

Completed:

- Chrome MV3 and Firefox MV3 builds.
- Manifest validation, Vitest unit tests, ESLint, Prettier, Firefox lint, and dependency audit.
- Contract-driven messaging and plugin-local `lib/` modules.
- Generated flat extension icons.
- Store listing, permission, and privacy document skeletons.
- Ten-plugin architecture coverage across NTP, browsing data, content scripts, clipboard, and canvas pages.
- Release artifact and signing workflow.

Still required before store submission:

- manual browser acceptance;
- real store screenshots;
- product/design review of generated icons;
- Google Translate endpoint verification;
- real Chrome Web Store and AMO submissions.

## Quick start

Requirements:

- Node.js `22.12.0`
- pnpm `9.15.9`

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install
pnpm build
```

Develop a plugin:

```bash
pnpm dev:dark-mode-lite
pnpm dev:tab-stash
pnpm dev:volume-booster
pnpm dev:quick-translate
pnpm dev:focus-lock
```

## Build and verify

`pnpm build` builds Chrome MV3 and Firefox MV3:

```bash
pnpm build
pnpm build:chrome
pnpm build:firefox
```

Full local check:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm validate:manifests
pnpm validate:store-readiness --allow-incomplete
pnpm audit --prod
```

E2E tests are separate and use Chromium:

```bash
pnpm build
pnpm test:e2e:install
pnpm test:e2e
```

Coverage:

```bash
pnpm test:coverage
```

Manifest validation checks the built output and supports a single plugin or browser:

```bash
pnpm validate:manifests --plugin dark-mode-lite --browser firefox
```

It verifies:

- Manifest V3;
- plugin package and version consistency;
- Firefox `gecko.id` and data-collection declaration;
- Chrome service-worker background when present;
- forbidden permissions and broad host patterns;
- icons, popup, options, and content-script files;
- required name and description.

Firefox source can be linted with:

```bash
pnpm exec web-ext lint --source-dir extensions/<plugin>/.output/firefox-mv3
```

## Local loading

### Chromium browsers

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Load `extensions/<plugin>/.output/chrome-mv3`.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose **Load Temporary Add-on**.
3. Load `extensions/<plugin>/.output/firefox-mv3/manifest.json`.

## Extension behavior

### Dark Mode Lite

- Applies CSS inversion to the current origin.
- Stores per-site enabled state and strength.
- Compensates images, video, canvas, SVG, and iframes.
- Requires reopening the popup after page reload because injection is activeTab-based.

### Tab Stash

- Saves stashable tabs to a named local group before closing them.
- Supports search, rename, restore-one, restore-all, delete, and JSON import/export.
- Detects duplicate URLs.
- Uses `tabs` and `storage`; no host permissions.

### Volume Booster

- Uses `MediaElementAudioSourceNode -> GainNode -> destination` above 100%.
- Keeps a per-site volume level.
- Re-applies volume when media elements are added dynamically.
- Reports unsupported non-CORS cross-origin media instead of silently muting audio.

### Quick Translate

- Activates only on the tab selected from the popup.
- Uses selection-change debounce and a memory cache.
- Sends translation requests from background with an AbortController timeout.
- Renders the result in Shadow DOM with copy support and RTL handling.
- Sends selected text to Google Translate; this is disclosed in the listing.

### Focus Lock

- Redirects blocked domains to `/blocked.html?domain=<domain>` with DNR.
- Supports per-domain five-minute unlock.
- Supports 60-second cooldown when no password is configured.
- Stores password as PBKDF2/SHA-256 hash and salt only.
- Supports domain JSON import/export.

### New Tab Dashboard

- Replaces the new tab page with local time, todos, and shortcuts.
- Does not request `search` or `settings`.
- Does not modify search settings or render remote content.

### Privacy Cleaner

- Cleans only the origin visible in the active tab.
- Requires an explicit click.
- Supports cookies, local storage, IndexedDB, and optional cache.
- Does not request `tabs` or perform automatic cleanup.

### Reading Progress

- Injects a fixed progress bar on demand.
- Uses rAF-throttled scroll updates.
- Stores per-site color, height, position, and enabled state.

### Clipboard History

- Captures only explicit `copy` events.
- Does not request `clipboardRead`.
- Stores up to 50 local text items.
- Supports search, copy, delete, and clear.

### Screenshot Annotator

- Captures the visible tab only after a popup click.
- Keeps capture data in session storage.
- Supports rectangle, arrow, and text annotations.
- Supports undo, copy, and local download.

## Permissions

| Plugin               | Permissions                                           | Host permissions                     |
| -------------------- | ----------------------------------------------------- | ------------------------------------ |
| Dark Mode Lite       | `activeTab`, `scripting`, `storage`                   | none                                 |
| Tab Stash            | `tabs`, `storage`                                     | none                                 |
| Volume Booster       | `activeTab`, `scripting`, `storage`                   | none                                 |
| Quick Translate      | `activeTab`, `scripting`, `storage`                   | `https://translate.googleapis.com/*` |
| Focus Lock           | `declarativeNetRequest`, `storage`, `alarms`          | none                                 |
| New Tab Dashboard    | `storage`                                             | none                                 |
| Privacy Cleaner      | `activeTab`, `browsingData`, `storage`                | none                                 |
| Reading Progress     | `activeTab`, `scripting`, `storage`                   | none                                 |
| Clipboard History    | `activeTab`, `scripting`, `storage`, `clipboardWrite` | none                                 |
| Screenshot Annotator | `activeTab`, `storage`, `clipboardWrite`              | none                                 |

Per-plugin store text and privacy summaries are under `docs/listings/<plugin>/`.

## Architecture

```text
packages/shared/src/
├── messaging.ts
├── storage.ts
└── ui/
```

Each plugin has a local `lib/` layer:

```text
extensions/<plugin>/lib/
├── types.ts
├── settings.ts
├── messages.ts
└── pure-logic.ts
```

`entrypoints/` wires browser APIs and UI; `lib/` contains reusable, testable logic. Message contracts are declared once and consumed by popup, background, and content script through `@hub/shared/messaging`.

WXT bundles `@hub/shared` into each extension, so published zips and xpi files do not depend on npm at runtime.

## Add a plugin

```bash
cp -R extensions/_template extensions/my-plugin
```

1. Change `package.json` name to `@hub/my-plugin`.
2. Update `wxt.config.ts`, permissions, Firefox gecko id, and data-collection declaration.
3. Add message and settings contracts under `lib/`.
4. Add listing documents under `docs/listings/my-plugin/`.
5. Run `pnpm install`.
6. Pass all checks from the build and verification section.

Manifest validation discovers plugins by directory, so a new plugin does not need to be appended to a hardcoded list.

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
2. builds Chrome and Firefox;
3. validates and lints the built extension;
4. packs Chrome zip, Firefox zip, Firefox source zip, and SHA256SUMS;
5. uploads Chrome draft with pinned CLI when secrets are present;
6. signs Firefox from downloaded artifact and uploads the signed xpi;
7. creates a GitHub Release using the signed Firefox artifact when available.

See [`docs/operations/release-checklist.md`](docs/operations/release-checklist.md).

### Store secrets

Chrome:

```text
CHROME_CLIENT_ID
CHROME_CLIENT_SECRET
CHROME_REFRESH_TOKEN
DARK_MODE_LITE_CHROME_EXTENSION_ID
TAB_STASH_CHROME_EXTENSION_ID
VOLUME_BOOSTER_CHROME_EXTENSION_ID
QUICK_TRANSLATE_CHROME_EXTENSION_ID
FOCUS_LOCK_CHROME_EXTENSION_ID
```

Firefox:

```text
AMO_JWT_ISSUER
AMO_JWT_SECRET
```

Missing store secrets skip store publishing but do not prevent GitHub Release artifacts.

## Documentation

- Design: [`docs/design/browser-extensions-hub.md`](docs/design/browser-extensions-hub.md)
- ADRs: [`docs/design/adr`](docs/design/adr)
- Roadmap: [`docs/roadmap.md`](docs/roadmap.md)
- Handoff: [`HANDOFF.md`](HANDOFF.md)
- Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Security: [`SECURITY.md`](SECURITY.md)
- Listings: [`docs/listings`](docs/listings)
- Release checklist: [`docs/operations/release-checklist.md`](docs/operations/release-checklist.md)

## Privacy

- No analytics, accounts, telemetry, or data selling.
- Settings and stashes remain local.
- Focus Lock keeps only a password hash and salt, never a plaintext password.
- Quick Translate sends selected text to Google Translate for translation.
