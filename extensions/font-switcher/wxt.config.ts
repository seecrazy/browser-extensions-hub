import { defineConfig } from "wxt";

export default defineConfig({
  outDir: "dist",
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: "Font Switcher Lite",
    short_name: "Font Switcher",
    description:
      "Apply locally installed Kai, Xingkai, Song, Hei, or FangSong fonts to the current page.",
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
              id: "font-switcher@browser-extensions-hub.local",
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
