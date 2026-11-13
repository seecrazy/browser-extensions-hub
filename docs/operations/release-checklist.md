# Release checklist

1. Update the plugin `package.json` version.
2. Confirm design, roadmap, README, and listing docs match the behavior.
3. Run:

   ```bash
   pnpm install --frozen-lockfile
   pnpm build
   pnpm typecheck
   pnpm lint
   pnpm format:check
   pnpm test
   pnpm validate:manifests
   pnpm audit --prod
   ```

4. Load Chrome and Firefox builds manually.
5. Test the plugin's core flow and at least one failure path.
6. Verify icons are final, not generated placeholders.
7. Confirm `docs/listings/<plugin>/screenshots.md` is complete.
8. Confirm privacy summary and permission justifications.
9. Commit and push.
10. Validate the tag locally:

    ```bash
    pnpm validate:release-tag <plugin>@<version>
    ```

11. Push the tag:

    ```bash
    git tag <plugin>@<version>
    git push origin <plugin>@<version>
    ```

12. Confirm workflow artifacts and GitHub Release.
13. If Chrome was uploaded as a draft, manually review and publish it.
14. Verify the signed Firefox xpi when AMO credentials are configured.
