import { browser } from "wxt/browser";

export default defineBackground(() => {
  // The dashboard has no persistent background work. These listeners keep the
  // MV3 service worker discoverable by automation without adding permissions.
  browser.runtime.onInstalled.addListener(() => undefined);
  browser.runtime.onStartup.addListener(() => undefined);
});
