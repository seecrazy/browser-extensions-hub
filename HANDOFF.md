# Handoff

## Current state

Iteration 3 is implemented on `main`.

- `@hub/shared` has contract-aware messaging and validated namespaced storage.
- Every plugin has local `lib/` types, settings, and message contracts.
- Dark Mode, Volume Booster, Tab Stash, Quick Translate, and Focus Lock have iteration-2 UX improvements.
- Vitest covers shared and plugin pure logic.
- Manifest validation supports all/single plugin and all/single browser.
- Release workflow packages and downloads artifacts; Firefox signs from a staging directory.
- CI runs build, typecheck, lint, format check, tests, Firefox lint, manifest validation, audit, and dependency review.
- Icons are generated flat PNGs at required sizes.
- Ten plugins cover NTP, browsingData, content scripts, clipboard, and canvas page scenarios.
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
```

## Next steps

1. Load all ten builds in Chrome and Firefox and complete manual QA.
2. Verify Quick Translate against the real Google endpoint.
3. Verify Privacy Cleaner on a disposable HTTP origin and Screenshot Annotator copy/download flows.
4. Review generated icons with design and replace if a richer visual identity is needed.
5. Capture store screenshots and complete `docs/listings/<plugin>/screenshots.md`.
6. Configure GitHub store secrets.
7. Run a release for one plugin and inspect all artifacts.
8. Confirm Chrome draft and signed Firefox behavior before public store submission.

## Notes

- Firefox minimum version is 142 because data-collection permissions require it.
- Runtime-injected content scripts use `matches: []` to avoid broad host permissions.
- Release publish jobs must download artifacts; do not rely on build job files.
- Manifest validation discovers extension directories; no hardcoded plugin list is required.
