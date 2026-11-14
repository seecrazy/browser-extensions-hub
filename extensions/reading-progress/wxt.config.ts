import { defineConfig } from "wxt";

export default defineConfig({
  outDir: "dist",
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: "Reading Progress Lite",
    short_name: "Reading Progress",
    description:
      "Add a lightweight reading progress bar to the current article. No network requests.",
    permissions: ["activeTab", "scripting", "storage"],
    icons: {
      "16": "/icon/16.png",
      "32": "/icon/32.png",
      "48": "/icon/48.png",
      "128": "/icon/128.png",
    },

    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: {
              id: "reading-progress@browser-extensions-hub.local",
              strict_min_version: "142.0",
              data_collection_permissions: {
                required: ["none"],
              },
            },
          },
        }
      : {}),
  }),
});
