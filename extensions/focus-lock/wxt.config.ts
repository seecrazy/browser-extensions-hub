import { defineConfig } from "wxt";

export default defineConfig({
  outDir: "dist",
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: "Focus Lock",
    short_name: "Focus Lock",
    description: "Block distracting domains locally. Unlock with a password or a short cooldown.",
    permissions: ["declarativeNetRequest", "storage", "alarms"],
    options_ui: {
      open_in_tab: true,
    },

    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: {
              id: "focus-lock@browser-extensions-hub.local",
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
