import { defineConfig } from "wxt";

export default defineConfig({
  outDir: "dist",
  manifestVersion: 3,
  manifest: {
    name: "Tab Stash",
    short_name: "Tab Stash",
    description: "Stash tabs from the current window and restore them later.",
    permissions: ["tabs", "storage"],
    options_ui: {
      open_in_tab: true,
    },
    browser_specific_settings: {
      gecko: {
        id: "tab-stash@browser-extensions-hub.local",
        strict_min_version: "142.0",
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
  },
});
