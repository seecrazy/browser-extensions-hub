# Release checklist

1. Update the plugin `package.json` version.
2. Confirm design, roadmap, README, and listing docs match the behavior.
3. Run:

   ```bash
   pnpm release <plugin>
   ```

   This runs the checks, builds and validates the selected plugin, and creates
   local release artifacts under `release/<plugin>/<version>`.

4. Load Chrome and Firefox builds manually.
5. Complete `docs/qa/<plugin>.md`.
6. Test the plugin's core flow and at least one failure path.
7. Verify icons are final, not generated placeholders.
8. Confirm `docs/listings/<plugin>/screenshots.md` is complete.
9. Confirm privacy summary and permission justifications.
10. Commit and push.
11. Validate the tag locally:

    ```bash
    pnpm release <plugin> --push
    ```

Or create the tag and push it manually:

    ```bash

pnpm release <plugin> --tag
git push origin <plugin>@<version>

````
 git push origin <plugin>@<version>
 ```

13. Confirm workflow artifacts and GitHub Release.
14. If Chrome was uploaded as a draft, manually review and publish it.
15. Verify the signed Firefox xpi when AMO credentials are configured.
````
