# font-switcher manual QA

Run after `pnpm build` before tagging a release.

- [ ] Open a normal website and open the popup.
- [ ] Confirm the popup connects to the current tab.
- [ ] Hover Kai, Song, Hei, and FangSong and confirm preview changes.
- [ ] Select each available font and confirm page typography changes.
- [ ] Select unavailable Xingkai and confirm a useful fallback renders.
- [ ] Click Use page default and confirm override is removed.
- [ ] Reload and reopen popup to confirm per-origin preference.
- [ ] Change default font in options.
- [ ] Clear local preferences and confirm defaults restore.
- [ ] Confirm no network requests beyond normal page traffic.
- [ ] Confirm `chrome://` page activation shows a friendly error.

## Result

- [ ] Chrome passed
- [ ] Firefox passed
- [ ] No console errors
- [ ] Permissions match the listing
