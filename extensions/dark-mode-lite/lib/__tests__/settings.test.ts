import { describe, expect, it } from "vitest";
import { getSiteState, patchSiteState } from "../settings";
import { darkModeDefaults, normalizeStrength } from "../types";

describe("dark mode settings", () => {
  it("normalizes strength bounds", () => {
    expect(normalizeStrength(-10)).toBe(0);
    expect(normalizeStrength(70)).toBe(70);
    expect(normalizeStrength(120)).toBe(100);
    expect(normalizeStrength("bad")).toBe(70);
  });

  it("keeps site state isolated", () => {
    const patched = patchSiteState(darkModeDefaults, "https://example.com", {
      enabled: true,
      strength: 45,
    });

    expect(getSiteState(patched, "https://example.com").settings).toEqual({
      enabled: true,
      strength: 45,
    });
    expect(getSiteState(patched, "https://other.com").settings).toEqual({
      enabled: false,
      strength: 70,
    });
  });
});
