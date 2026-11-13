# volume-booster manual QA

Run after `pnpm build` before tagging a release.

- [ ] Open a page with video/audio.
- [ ] Open popup and confirm media count.
- [ ] Increase above 100% and confirm Web Audio gain.
- [ ] Test a cross-origin non-CORS media page if available.
- [ ] Confirm unsupported elements do not exceed 100%.
- [ ] Reload and confirm per-site level re-applies after popup injection.

## Result

- [ ] Chrome passed
- [ ] Firefox passed
- [ ] No console errors
- [ ] Permissions match the listing
