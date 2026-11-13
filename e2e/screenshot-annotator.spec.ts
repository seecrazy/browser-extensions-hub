import { expect, test } from "@playwright/test";
import { openExtensionPage } from "./helpers/extension";

test("annotate page exposes annotation tools", async () => {
  const { context, page } = await openExtensionPage("screenshot-annotator", "annotate.html");
  await expect(page.getByText("No screenshot found")).toBeVisible();
  await expect(page.getByLabel("Tool")).toBeVisible();
  await context.close();
});
