# newtab-dashboard manual QA

Run after `pnpm build` before tagging a release.

- [ ] Open a new tab and confirm dashboard.
- [ ] Add, toggle, complete, and delete a todo.
- [ ] Add a shortcut and click it.
- [ ] Enter a javascript: URL manually via storage and confirm sanitizer blocks it.
- [ ] Confirm no search box is shown and search settings are unchanged.

## Result

- [ ] Chrome passed
- [ ] Firefox passed
- [ ] No console errors
- [ ] Permissions match the listing
