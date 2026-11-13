import { expect, test } from "@playwright/test";
import { openExtensionPage } from "./helpers/extension";

test("new tab dashboard stores local todos", async () => {
  const { context, page } = await openExtensionPage("newtab-dashboard", "newtab.html");
  const input = page.getByPlaceholder("Add a task");
  await input.fill("E2E todo");
  await page.locator("#todo-form").getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("E2E todo")).toBeVisible();
  await page.reload();
  await expect(page.getByText("E2E todo")).toBeVisible();
  await context.close();
});
