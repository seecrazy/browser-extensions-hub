import { defineConfig } from "wxt";

export default defineConfig({
  manifestVersion: 3,
  manifest: {
    name: "Hub Template",
    short_name: "Hub Template",
    description: "A minimal WXT extension template.",
    permissions: ["storage"],
    browser_specific_settings: {
      gecko: {
        id: "hub-template@browser-extensions-hub.local",
        strict_min_version: "115.0",
      },
    },
  },
});
