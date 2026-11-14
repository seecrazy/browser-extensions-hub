# Handoff

## Current state

Iteration 4 is implemented on `main`.

- `@hub/shared` has contract-aware messaging and validated namespaced storage.
- Every plugin has local `lib/` types, settings, and message contracts.
- Dark Mode, Volume Booster, Tab Stash, Quick Translate, and Focus Lock have iteration-2 UX improvements.
- Vitest covers shared and plugin pure logic.
- Manifest validation supports all/single plugin and all/single browser.
- Release workflow packages and downloads artifacts; Firefox signs from a staging directory.
- CI runs build, typecheck, lint, format check, tests, Firefox lint, manifest validation, audit, and dependency review.
- Icons are generated flat PNGs at required sizes.
- Ten plugins cover NTP, browsingData, content scripts, clipboard, and canvas page scenarios.
- Shared storage writes are serialized per namespace.
- Shared injection and status helpers reduce popup duplication.
- Quick Translate has been reverted to the first-version tab-only scope: language selection, activeTab activation, Shadow DOM bubble, and background Google Translate request. It has no per-site/all-site permissions or advanced settings.
- Shared advanced-settings disclosure keeps low-frequency controls collapsed.
- Store readiness validation, QA checklists, per-plugin docs, coverage, CodeQL, release smoke checks, and a Playwright E2E skeleton are present.
- Store listing, privacy, permission, and screenshot documents exist for all shipped plugins.
- Turbo dead config has been removed; builds use `pnpm -r`.

The following commands pass locally:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm validate:manifests
pnpm audit --prod
pnpm validate:store-readiness --allow-incomplete
pnpm test:coverage
```

## Next steps

1. Load all ten builds in Chrome and Firefox and complete `docs/qa/<plugin>.md`.
2. Verify Quick Translate against real Google endpoints and capture any service-worker error.
3. Verify Privacy Cleaner on a disposable HTTP origin and Screenshot Annotator copy/download flows.
4. Configure GitHub Environments `chrome-publish` and `firefox-publish` before real store publishing.
5. Review generated icons with design and replace if a richer visual identity is needed.
6. Capture store screenshots and complete `docs/listings/<plugin>/screenshots.md`.
7. Configure GitHub store secrets.
8. Run a release for one plugin and inspect all artifacts.
9. Confirm Chrome draft and signed Firefox behavior before public store submission.

## Notes

- Firefox minimum version is 142 because data-collection permissions require it.
- Runtime-injected content scripts use `matches: []` to avoid broad host permissions.
- Release publish jobs must download artifacts; do not rely on build job files.
- Manifest validation discovers extension directories; no hardcoded plugin list is required.

## UI alignment

All plugin surfaces now use a shared Chrome-native light/dark design system. Core behavior is unchanged.
