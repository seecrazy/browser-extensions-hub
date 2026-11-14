import { expect, test } from "@playwright/test";
import { openExtensionPage } from "./helpers/extension";

test("quick translate explains that restricted pages cannot be activated", async () => {
  const { context, page } = await openExtensionPage("quick-translate", "popup.html");

  await page.getByRole("button", { name: "Enable on this tab" }).click();
  await expect(page.locator("#status")).toHaveText(
    "This page type cannot be translated. Open an http or https website, then activate.",
  );

  await context.close();
});
