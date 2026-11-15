# Local release command

The release script keeps the tag-driven workflow, but wraps all local release
steps into one command.

## Prerequisites

1. Update `extensions/<plugin>/package.json` to the release version.
2. Update docs, listings, QA, and README if behavior changed.
3. Commit all changes.

## Build and package a release candidate

```bash
pnpm release <plugin>
```

The command:

1. Requires a clean Git tree.
2. Installs dependencies with a frozen lockfile.
3. Runs typecheck, lint, format, tests, and production audit.
4. Builds Chrome and Firefox only for the selected plugin.
5. Validates and lints both builds.
6. Packs Chrome, Firefox, and Firefox source artifacts.
7. Generates `store-metadata.json` and `chrome-store-submission.md` from the Chrome listing.
8. Generates `SHA256SUMS`.

Artifacts are written to:

```text
release/<plugin>/<version>/
```

The generated submission files contain:

- `store-metadata.json`: machine-readable Chrome listing, permissions, compliance fields, and open dashboard items.
- `chrome-store-submission.md`: copy-ready name, short description, detailed description, single purpose, permission and host-permission justifications, privacy summary, and a checklist for dashboard-only fields such as category and screenshots.

Generate or refresh store assets before release:

```bash
pnpm generate:store-images <plugin>
```

This produces the Chrome Web Store image sizes:

| Asset                   | Size     | Output                                     |
| ----------------------- | -------- | ------------------------------------------ |
| Main screenshot         | 1280×800 | `images/screenshots/main-1280x800.png`     |
| Secondary screenshot    | 640×400  | `images/screenshots/secondary-640x400.png` |
| Small promo tile        | 440×280  | `images/promo/small-440x280.png`           |
| Marquee/top promo image | 1400×560 | `images/promo/marquee-1400x560.png`        |

While store screenshots are incomplete, release candidates use the same
allowance as CI automatically.

```bash
pnpm release <plugin>
```

To enforce a complete listing instead:

```bash
pnpm release <plugin> --publish
```

## Direct store submission

Before using this mode, export store credentials locally. Never commit them.

```bash
export CHROME_CLIENT_ID=...
export CHROME_CLIENT_SECRET=...
export CHROME_REFRESH_TOKEN=...
export CHROME_PUBLISHER_ID=...
export DARK_MODE_LITE_CHROME_EXTENSION_ID=...
export AMO_JWT_ISSUER=...
export AMO_JWT_SECRET=...

pnpm release <plugin> --publish
```

Skip one store when needed:

```bash
pnpm release <plugin> --publish --skip-chrome
pnpm release <plugin> --publish --skip-firefox
```

This mode is explicit and final: it uploads and publishes Chrome, and submits
Firefox to the listed AMO channel. Review the version and artifacts first.

Direct submission requires a complete store-listing checklist. Only use the
following override if the incomplete items are known and accepted:

```bash
pnpm release <plugin> --publish --allow-incomplete
```

## Tag and trigger CI

This is the canonical release path:

```bash
pnpm release <plugin> --push
```

It creates `<plugin>@<version>`, pushes the current branch and tag, and starts
`.github/workflows/release.yml`.

To only create the tag locally, use:

```bash
pnpm release <plugin> --tag
```
