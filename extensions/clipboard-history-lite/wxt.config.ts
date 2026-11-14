import { defineConfig } from "wxt";

export default defineConfig({
  outDir: "dist",
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: "Clipboard History Lite",
    short_name: "Clipboard History",
    description:
      "Keep the last 50 items you explicitly copied. Local-only history; no clipboard reading.",
    permissions: ["activeTab", "scripting", "storage", "clipboardWrite"],
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
              id: "clipboard-history-lite@browser-extensions-hub.local",
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
