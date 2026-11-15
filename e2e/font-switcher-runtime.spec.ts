import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium, expect, test } from "@playwright/test";

function createTestExtension(): string {
  const source = path.resolve("extensions/font-switcher/dist/chrome-mv3");
  const destination = mkdtempSync(path.join(tmpdir(), "hub-font-switcher-e2e-"));

  cpSync(source, destination, { recursive: true });

  // The production extension has no background worker and no host permissions.
  // This temporary test copy grants hosts so Playwright can exercise the same
  // injection/message sequence used by the popup.
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

test("font switcher content script applies a font class", async () => {
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

    const response = await worker.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        throw new Error("No active tab");
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["/content-scripts/font-switcher.js"],
      });

      await chrome.tabs.sendMessage(tab.id, {
        type: "FONT_SWITCHER_SET_FONT",
        payload: { fontKey: "songti" },
      });

      return chrome.tabs.sendMessage(tab.id, { type: "FONT_SWITCHER_GET_SITE_STATE" });
    });

    expect(response).toMatchObject({
      ok: true,
      data: {
        origin: "https://example.com",
        settings: { enabled: true, fontKey: "songti" },
      },
    });
    await target.waitForFunction(() => document.body.classList.contains("font-switcher-song"));
  } finally {
    await context.close();
    rmSync(extensionPath, { recursive: true, force: true });
  }
});
