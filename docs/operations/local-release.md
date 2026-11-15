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
7. Generates `SHA256SUMS`.

Artifacts are written to:

```text
release/<plugin>/<version>/
```

Incomplete store screenshots can follow current CI behavior with:

```bash
pnpm release <plugin> --allow-incomplete
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
