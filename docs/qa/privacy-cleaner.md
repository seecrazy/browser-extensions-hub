# privacy-cleaner manual QA

Run after `pnpm build` before tagging a release.

- [ ] Open a disposable site and set known cookies/localStorage/IndexedDB data.
- [ ] Open popup and confirm origin.
- [ ] Click Clean this site.
- [ ] Confirm selected types are cleared and result text lists them.
- [ ] Confirm only that origin is affected.
- [ ] Verify cleanup does not run without clicking.

## Result

- [ ] Chrome passed
- [ ] Firefox passed
- [ ] No console errors
- [ ] Permissions match the listing
