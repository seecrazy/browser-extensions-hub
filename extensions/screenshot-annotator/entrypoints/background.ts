import { browser } from "wxt/browser";

export default defineBackground(() => {
  // Capture runs from the popup. These listeners keep the MV3 service worker
  // discoverable by automation without adding permissions.
  browser.runtime.onInstalled.addListener(() => undefined);
  browser.runtime.onStartup.addListener(() => undefined);
});
