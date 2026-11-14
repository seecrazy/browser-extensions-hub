import path from "node:path";
import { chromium, type BrowserContext, type Page } from "@playwright/test";

type ChromeExtensionInfo = {
  id: string;
  path: string;
};

export async function launchWithExtension(plugin: string): Promise<{
  context: BrowserContext;
  extensionOrigin: string;
}> {
  const extensionPath = path.resolve(process.cwd(), "extensions", plugin, "dist", "chrome-mv3");
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  const extensionOrigin = await resolveExtensionOrigin(context, extensionPath);

  if (!extensionOrigin) {
    await context.close();
    throw new Error("Unable to determine extension origin.");
  }

  return {
    context,
    extensionOrigin,
  };
}

async function resolveExtensionOrigin(
  context: BrowserContext,
  extensionPath: string,
): Promise<string | undefined> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const workerOrigin = context
      .serviceWorkers()
      .find((worker) => worker.url().startsWith("chrome-extension://"))
      ?.url()
      .match(/^chrome-extension:\/\/([^/]+)/)?.[0];

    if (workerOrigin) {
      return workerOrigin;
    }

    const worker = await context
      .waitForEvent("serviceworker", { timeout: 1000 })
      .then((worker) => worker.url().match(/^chrome-extension:\/\/([^/]+)/)?.[0])
      .catch(() => undefined);

    if (worker) {
      return worker;
    }
  }

  const extensionsPage = await context.newPage();
  await extensionsPage.goto("chrome://extensions/");
  const extensions: ChromeExtensionInfo[] = await extensionsPage.evaluate(async () => {
    const extensions = await chrome.developerPrivate.getExtensionsInfo({
      includeDisabled: false,
    });

    return extensions.map((extension) => ({
      id: extension.id,
      path: extension.path,
    }));
  });
  await extensionsPage.close();
  const loadedExtension = extensions.find(
    (extension) => path.resolve(extension.path) === extensionPath,
  );

  return loadedExtension ? `chrome-extension://${loadedExtension.id}` : undefined;
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
