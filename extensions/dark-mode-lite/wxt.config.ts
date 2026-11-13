import { defineConfig } from "wxt";

export default defineConfig({
  manifestVersion: 3,
  manifest: {
    name: "Dark Mode Lite",
    short_name: "Dark Mode Lite",
    description:
      "A lightweight dark mode for the current tab. No broad host permissions and no data collection.",
    permissions: ["activeTab", "scripting", "storage"],
    icons: {
      "16": "/icon/16.png",
      "32": "/icon/32.png",
      "48": "/icon/48.png",
      "128": "/icon/128.png",
    },
    browser_specific_settings: {
      gecko: {
        id: "dark-mode-lite@browser-extensions-hub.local",
        strict_min_version: "142.0",
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
  },
});
