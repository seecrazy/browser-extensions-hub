import { defineConfig } from "wxt";

export default defineConfig({
  outDir: "dist",
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: "Privacy Cleaner Lite",
    short_name: "Privacy Cleaner",
    description:
      "Clear cookies, storage, and cache for the current site only. Manual, local, and user-triggered.",
    permissions: ["activeTab", "browsingData", "storage"],
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
              id: "privacy-cleaner@browser-extensions-hub.local",
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
