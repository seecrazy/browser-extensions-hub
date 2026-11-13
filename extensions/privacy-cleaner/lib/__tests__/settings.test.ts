import { describe, expect, it } from "vitest";
import { activeCleanupTypes, normalizeOrigin, validatePrivacySettings } from "../types";

describe("privacy cleaner", () => {
  it("normalizes active tab origins", () => {
    expect(normalizeOrigin("https://example.com/path?query=1")).toBe("https://example.com");
    expect(() => normalizeOrigin("chrome://extensions")).toThrow();
    expect(() => normalizeOrigin(undefined)).toThrow();
  });

  it("converts selected cleanup types to browsingData keys", () => {
    expect(
      activeCleanupTypes({
        cookies: true,
        localStorage: false,
        indexedDb: true,
        cache: false,
      }),
    ).toEqual({
      cookies: true,
      indexedDB: true,
    });
  });

  it("validates stored settings", () => {
    const settings = validatePrivacySettings({
      cleanup: {
        cookies: "yes",
        localStorage: true,
        indexedDb: false,
        cache: 1,
      },
    });

    expect(settings).toEqual({
      schemaVersion: 1,
      cleanup: {
        cookies: false,
        localStorage: true,
        indexedDb: false,
        cache: false,
      },
    });
  });
});
