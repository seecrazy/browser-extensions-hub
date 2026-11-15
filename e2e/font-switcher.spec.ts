import { expect, test } from "@playwright/test";
import { openExtensionPage } from "./helpers/extension";

test("font switcher popup exposes local font options", async () => {
  const { context, page } = await openExtensionPage("font-switcher", "popup.html");

  await expect(page.getByText("Font Switcher")).toBeVisible();
  await expect(page.locator(".font-item")).toHaveCount(6);
  await expect(page.getByText("楷体")).toBeVisible();
  await expect(page.getByRole("button", { name: "Page default", exact: true })).toBeVisible();

  await context.close();
});
