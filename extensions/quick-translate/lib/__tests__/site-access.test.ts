import { describe, expect, it } from "vitest";
import {
  createSiteScriptId,
  getSiteAccessState,
  isSiteEnabled,
  normalizeOrigin,
  originToMatchPattern,
  setSiteEnabled,
} from "../site-access";
import { translateDefaults } from "../types";

describe("quick translate site access", () => {
  it("normalizes origins and match patterns", () => {
    expect(normalizeOrigin("https://www.example.com/path?query=1")).toBe("https://www.example.com");
    expect(originToMatchPattern("https://www.example.com/path")).toBe("https://www.example.com/*");
    expect(originToMatchPattern("chrome://extensions")).toBeNull();
    expect(normalizeOrigin(undefined)).toBeNull();
  });

  it("creates stable script ids", () => {
    const first = createSiteScriptId("https://example.com/path");
    const second = createSiteScriptId("https://example.com/other");

    expect(first).toBe(second);
    expect(first).toMatch(/^quick-translate-[0-9a-z]+$/);
  });

  it("toggles and reports per-site state", () => {
    const enabled = setSiteEnabled(translateDefaults, "https://example.com/page", true);

    expect(isSiteEnabled(enabled, "https://example.com/other")).toBe(true);
    expect(getSiteAccessState(enabled, "https://example.com/page")).toEqual({
      origin: "https://example.com",
      pattern: "https://example.com/*",
      enabled: true,
      allSites: false,
      disabledOnThisOrigin: false,
      supported: true,
    });

    const disabled = setSiteEnabled(enabled, "https://example.com/other", false);
    expect(isSiteEnabled(disabled, "https://example.com")).toBe(false);
    expect(getSiteAccessState(disabled, "https://example.com")).toEqual({
      origin: "https://example.com",
      pattern: "https://example.com/*",
      enabled: false,
      allSites: false,
      disabledOnThisOrigin: false,
      supported: true,
    });
  });
});
