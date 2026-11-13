import path from "node:path";
import { chromium, type BrowserContext, type Page } from "@playwright/test";

export async function launchWithExtension(plugin: string): Promise<{
  context: BrowserContext;
  extensionOrigin: string;
}> {
  const extensionPath = path.resolve(process.cwd(), "extensions", plugin, ".output", "chrome-mv3");
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });

  const serviceWorker = context
    .serviceWorkers()
    .find((worker) => worker.url().startsWith("chrome-extension://"));

  if (!serviceWorker) {
    await context.waitForEvent("serviceworker", { timeout: 5000 }).catch(() => undefined);
  }

  const worker = context
    .serviceWorkers()
    .find((worker) => worker.url().startsWith("chrome-extension://"));
  const extensionOrigin = worker?.url().match(/^chrome-extension:\/\/([^/]+)/)?.[0];

  if (!extensionOrigin) {
    throw new Error("Unable to determine extension origin.");
  }

  return {
    context,
    extensionOrigin,
  };
}

export async function openExtensionPage(
  plugin: string,
  file: string,
): Promise<{ context: BrowserContext; page: Page }> {
  const { context, extensionOrigin } = await launchWithExtension(plugin);
  const page = await context.newPage();
  await page.goto(`${extensionOrigin}/${file}`);

  return {
    context,
    page,
  };
}
