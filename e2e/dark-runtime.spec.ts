import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium, expect, test } from "@playwright/test";

function createTestExtension(): string {
  const source = path.resolve("extensions/dark-mode-lite/dist/chrome-mv3");
  const destination = mkdtempSync(path.join(tmpdir(), "hub-dark-mode-e2e-"));

  cpSync(source, destination, { recursive: true });

  // The production extension intentionally uses activeTab and has no background
  // worker. This temporary test copy grants hosts so Playwright can exercise the
  // exact injection/message sequence from an extension worker.
  const manifestPath = path.join(destination, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
  manifest.host_permissions = ["<all_urls>"];
  manifest.background = { service_worker: "/background.js" };
  writeFileSync(manifestPath, JSON.stringify(manifest));
  writeFileSync(
    path.join(destination, "background.js"),
    "chrome.runtime.onInstalled.addListener(() => {});\n",
  );

  return destination;
}

test("dark mode content script handles repeated runtime injection and messages", async () => {
  const extensionPath = createTestExtension();
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });

  try {
    let worker = context
      .serviceWorkers()
      .find((item) => item.url().startsWith("chrome-extension://"));

    if (!worker) {
      worker = await context.waitForEvent("serviceworker", { timeout: 5000 });
    }

    const target = await context.newPage();
    await target.goto("https://example.com/");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await worker.evaluate(async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab?.id) {
          throw new Error("No active tab");
        }

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["/content-scripts/dark-mode.js"],
        });

        return chrome.tabs.sendMessage(tab.id, { type: "DARK_MODE_GET_SITE_STATE" });
      });

      expect(response).toMatchObject({
        ok: true,
        data: { origin: "https://example.com", settings: { enabled: false, strength: 70 } },
      });
    }

    await worker.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        throw new Error("No active tab");
      }

      await chrome.tabs.sendMessage(tab.id, {
        type: "DARK_MODE_SET_SITE_STATE",
        payload: { enabled: true, strength: 80 },
      });
    });

    await target.waitForSelector("#__hub_dark_mode_lite_style__", {
      state: "attached",
      timeout: 5000,
    });

    const filter = await target.evaluate(() => getComputedStyle(document.documentElement).filter);
    expect(filter).toContain("invert(1)");
  } finally {
    await context.close();
    rmSync(extensionPath, { recursive: true, force: true });
  }
});
