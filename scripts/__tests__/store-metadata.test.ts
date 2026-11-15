import { describe, expect, it } from "vitest";
import { buildChromeStoreMetadata, parseChromeListing } from "../lib/store-metadata";

describe("Chrome store metadata", () => {
  it("parses the documented listing fields", () => {
    const listing = parseChromeListing(
      [
        "# Example — Chrome Web Store listing",
        "",
        "## Name",
        "",
        "Example Lite",
        "",
        "## Short description",
        "",
        "A concise summary.",
        "",
        "## Detailed description",
        "",
        "A longer description.",
        "",
        "## Single purpose",
        "",
        "Translate selected text.",
        "",
        "## Permission justifications",
        "",
        "- `storage`: storage keeps local settings.",
      ].join("\n"),
    );

    expect(listing.name).toBe("Example Lite");
    expect(listing.summary).toBe("A concise summary.");
    expect(listing.description).toBe("A longer description.");
    expect(listing.singlePurpose).toBe("Translate selected text.");
    expect(listing.permissionJustifications.storage).toBe("storage keeps local settings.");
  });

  it("builds copyable submission metadata and identifies dashboard-only fields", () => {
    const metadata = buildChromeStoreMetadata({
      plugin: "example",
      packageName: "@hub/example",
      version: "1.2.3",
      listing: {
        name: "Example Lite",
        summary: "A concise summary.",
        description: "A longer description.",
        singlePurpose: "Translate selected text.",
        permissionJustifications: {
          storage: "storage keeps local settings.",
        },
      },
      privacyMarkdown: "# Privacy\n\n- Runs locally.\n- No analytics.\n",
      permissionsMarkdown: "# Permissions\n\nstorage keeps local settings.",
      manifest: {
        version: "1.2.3",
        permissions: ["storage"],
        host_permissions: [],
        icons: {},
      },
      screenshotPaths: ["images/screenshots/main-1280x800.png"],
      promoImages: { small: "images/promo/small-440x280.png", marquee: null },
    });

    expect(metadata.listing).toMatchObject({
      name: "Example Lite",
      summary: "A concise summary.",
      description: "A longer description.",
    });
    expect(metadata.compliance.singlePurpose).toBe("Translate selected text.");
    expect(metadata.listing.screenshotPaths).toEqual(["images/screenshots/main-1280x800.png"]);
    expect(metadata.openItems).not.toContain("Add the required store screenshots.");
  });

  it("rejects package and manifest version mismatches", () => {
    expect(() =>
      buildChromeStoreMetadata({
        plugin: "example",
        packageName: "@hub/example",
        version: "1.2.3",
        listing: {
          name: "Example Lite",
          summary: "A concise summary.",
          description: "A longer description.",
          singlePurpose: "Translate selected text.",
          permissionJustifications: {
            storage: "storage keeps local settings.",
          },
        },
        privacyMarkdown: "- Runs locally.\n",
        permissionsMarkdown: "storage keeps local settings.",
        manifest: { version: "0.0.1" },
      }),
    ).toThrow(/does not match package version/);
  });
});
