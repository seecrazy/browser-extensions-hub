import { defineConfig } from "wxt";

export default defineConfig({
  manifestVersion: 3,
  manifest: {
    name: "Volume Booster Lite",
    short_name: "Volume Booster",
    description: "Boost volume for media elements in the current tab up to 300%.",
    permissions: ["activeTab", "scripting", "storage"],
    browser_specific_settings: {
      gecko: {
        id: "volume-booster@browser-extensions-hub.local",
        strict_min_version: "115.0",
      },
    },
  },
});
