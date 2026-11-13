import { defineConfig } from "wxt";

export default defineConfig({
  manifestVersion: 3,
  manifest: {
    name: "Quick Translate",
    short_name: "Quick Translate",
    description:
      "Select text in an activated tab and get an instant translation. No broad host permissions.",
    permissions: ["activeTab", "scripting", "storage"],
    host_permissions: ["https://translate.googleapis.com/*"],
    browser_specific_settings: {
      gecko: {
        id: "quick-translate@browser-extensions-hub.local",
        strict_min_version: "142.0",
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
  },
});
