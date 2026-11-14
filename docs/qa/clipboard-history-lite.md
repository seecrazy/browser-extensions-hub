# clipboard-history-lite manual QA

Run after `pnpm build` before tagging a release.

- [ ] Open popup and click Enable on this tab.
- [ ] Copy selected text.
- [ ] Confirm it appears in popup.
- [ ] Copy it again and confirm dedupe moves it to top.
- [ ] Click Copy in popup.
- [ ] Disable site, copy again, and confirm it is not saved.
- [ ] Clear history and confirm empty.

## Result

- [ ] Chrome passed
- [ ] Firefox passed
- [ ] No console errors
- [ ] Permissions match the listing
