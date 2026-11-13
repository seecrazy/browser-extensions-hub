# focus-lock manual QA

Run after `pnpm build` before tagging a release.

- [ ] Open options and add example.com.
- [ ] Attempt https://example.com and confirm blocked page.
- [ ] Confirm blocked domain is displayed.
- [ ] Unlock one domain and confirm only that domain opens.
- [ ] Set password and test wrong-password lockout.
- [ ] Import/export domain JSON.

## Result

- [ ] Chrome passed
- [ ] Firefox passed
- [ ] No console errors
- [ ] Permissions match the listing
