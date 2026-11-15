import { describe, expect, it } from "vitest";
import { fontClassMap, fontFaceCss, fontOptions } from "../fonts";
import { getSiteState, patchDefaultFont, patchSiteState } from "../settings";
import {
  fontKeys,
  fontSwitcherDefaults,
  normalizeFontKey,
  validateFontSwitcherSettings,
} from "../types";
import { fontSwitcherMessages } from "../messages";

describe("font switcher settings", () => {
  it("normalizes known and unknown font keys", () => {
    expect(fontKeys).toEqual(["", "kaiti", "xingkai", "songti", "heiti", "fangti"]);
    expect(normalizeFontKey("heiti")).toBe("heiti");
    expect(normalizeFontKey("comic-sans")).toBe("");
    expect(normalizeFontKey(null)).toBe("");
  });

  it("returns the default state for a new origin", () => {
    const state = getSiteState(fontSwitcherDefaults, "https://example.com");

    expect(state).toEqual({
      origin: "https://example.com",
      settings: { enabled: false, fontKey: "kaiti" },
      defaultFont: "kaiti",
    });
  });

  it("enables a selected font and disables with the default key", () => {
    const enabled = patchSiteState(fontSwitcherDefaults, "https://example.com", {
      fontKey: "fangti",
    });

    expect(enabled.sites["https://example.com"]).toEqual({
      enabled: true,
      fontKey: "fangti",
    });

    const disabled = patchSiteState(enabled, "https://example.com", { fontKey: "" });

    expect(disabled.sites["https://example.com"]).toEqual({
      enabled: false,
      fontKey: "kaiti",
    });
  });

  it("changes and validates the default font", () => {
    expect(patchDefaultFont(fontSwitcherDefaults, "songti").defaultFont).toBe("songti");
    expect(patchDefaultFont(fontSwitcherDefaults, "").defaultFont).toBe("kaiti");
    expect(validateFontSwitcherSettings({ defaultFont: "heiti", sites: {} }).defaultFont).toBe(
      "heiti",
    );
    expect(validateFontSwitcherSettings({ defaultFont: "bad", sites: [] }).defaultFont).toBe(
      "kaiti",
    );
  });

  it("keeps stable CSS aliases, classes, and message keys", () => {
    expect(fontClassMap.fangti).toBe("font-switcher-fang");
    expect(fontOptions.map((option) => option.key)).toEqual([
      "kaiti",
      "xingkai",
      "songti",
      "heiti",
      "fangti",
    ]);
    expect(fontFaceCss).toContain('font-family: "FontSwitcherXing"');
    expect(Object.keys(fontSwitcherMessages)).toEqual([
      "FONT_SWITCHER_GET_SITE_STATE",
      "FONT_SWITCHER_SET_FONT",
      "FONT_SWITCHER_SET_DEFAULT",
    ]);
  });
});
