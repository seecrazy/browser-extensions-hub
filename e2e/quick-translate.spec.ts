import { expect, test } from "@playwright/test";
import { openExtensionPage } from "./helpers/extension";

test("Quick Translate keeps the base popup minimal and advanced controls collapsed", async () => {
  const { context, page } = await openExtensionPage("quick-translate", "popup.html");

  await expect(page.locator("#site-state")).toHaveText("Unsupported page");
  await expect(page.locator("#site-toggle")).toBeHidden();
  await expect(page.locator("#language")).toBeHidden();
  await expect(page.locator("#timeout")).toBeHidden();
  await expect(page.locator("#activate")).toBeHidden();
  await expect(page.locator("#enable-all")).toBeHidden();
  await expect(page.locator("#disable-all")).toBeHidden();
  await expect(page.locator(".qt-advanced-card")).not.toHaveAttribute("open");

  await page.click(".qt-advanced-summary");

  await expect(page.locator("#language")).toBeVisible();
  await expect(page.locator("#timeout")).toBeVisible();
  await expect(page.locator("#activate")).toBeVisible();
  await expect(page.locator("#enable-all")).toBeHidden();
  await expect(page.locator("#disable-all")).toBeHidden();

  await context.close();
});
