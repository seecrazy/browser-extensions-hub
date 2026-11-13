import { defineConfig } from "wxt";

export default defineConfig({
  manifestVersion: 3,
  manifest: {
    name: "Screenshot Annotator Lite",
    short_name: "Screenshot Annotator",
    description: "Capture the visible tab, annotate it locally, then copy or download it.",
    permissions: ["activeTab", "storage", "clipboardWrite"],
    icons: {
      "16": "/icon/16.png",
      "32": "/icon/32.png",
      "48": "/icon/48.png",
      "128": "/icon/128.png",
    },
    browser_specific_settings: {
      gecko: {
        id: "screenshot-annotator@browser-extensions-hub.local",
        strict_min_version: "142.0",
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
  },
});
