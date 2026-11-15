# ADR 0015: Local Release Orchestration

## Status

Accepted

## Context

Release automation previously required contributors to run a long checklist by
hand and then create/push a tag manually. This was error-prone and duplicated
release logic between documentation, local shell commands, and GitHub Actions.
The workflow also contained incorrect artifact paths and used the wrong
Chrome Web Store CLI binary name.

## Decision

- Add one local entry point: `pnpm release <plugin>`.
- By default, the command runs quality gates, builds only the selected plugin,
  validates both browser manifests, lints Firefox, packages Chrome/Firefox and
  source archives, and creates checksums.
- Release candidates allow incomplete listing assets with the same explicit
  warning used by CI while real screenshots remain pending.
- `--publish` performs explicit direct store submission from local credentials.
  It can be limited with `--skip-chrome` or `--skip-firefox`.
- Direct submission enforces a complete listing unless `--allow-incomplete` is
  passed explicitly.
- `--tag` creates the validated annotated release tag.
- `--push` creates and pushes the tag, which triggers the existing tag-driven
  GitHub Actions release.
- The script never changes versions, commits, or bypasses the Git tree-clean
  requirement. Contributors must update `package.json` and commit first.

## Consequences

- One command covers the complete local release candidate flow.
- A release candidate cannot accidentally become a strict store gate, while a
  final direct submission cannot silently bypass listing completeness.
- Direct store submission is explicit and cannot accidentally push code.
- Tag-push publishing remains the canonical reproducible CI flow.
- Chrome Web Store submissions use the actual `chrome-webstore-upload` binary
  and the `CHROME_PUBLISHER_ID` required by CLI v4.
- GitHub Actions artifact paths use the selected plugin name.
