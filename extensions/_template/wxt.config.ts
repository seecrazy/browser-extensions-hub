import { defineConfig } from "wxt";

export default defineConfig({
  outDir: "dist",
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: "Hub Template",
    short_name: "Hub Template",
    description: "A minimal WXT extension template.",
    permissions: ["storage"],

    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: {
              id: "hub-template@browser-extensions-hub.local",
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
