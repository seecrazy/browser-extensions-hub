import { defineConfig } from "wxt";

export default defineConfig({
  manifestVersion: 3,
  manifest: {
    name: "New Tab Dashboard Lite",
    short_name: "Dashboard Lite",
    description:
      "A local, privacy-friendly new tab dashboard with time, todos, and shortcuts. No search override.",
    permissions: ["storage"],
    icons: {
      "16": "/icon/16.png",
      "32": "/icon/32.png",
      "48": "/icon/48.png",
      "128": "/icon/128.png",
    },
    browser_specific_settings: {
      gecko: {
        id: "newtab-dashboard@browser-extensions-hub.local",
        strict_min_version: "142.0",
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
  },
});
