import { describe, expect, it } from "vitest";
import { getSiteState, patchSiteState } from "../settings";
import { normalizeColor, normalizeHeight, normalizePosition } from "../types";

describe("reading progress", () => {
  it("normalizes preferences", () => {
    expect(normalizeColor("#ABCDEF")).toBe("#abcdef");
    expect(normalizeColor("red")).toBe("#60a5fa");
    expect(normalizeHeight(1)).toBe(2);
    expect(normalizeHeight(20)).toBe(12);
    expect(normalizePosition("bottom")).toBe("bottom");
    expect(normalizePosition("elsewhere")).toBe("top");
  });

  it("keeps site state isolated", () => {
    const settings = patchSiteState({ schemaVersion: 1, sites: {} }, "https://example.com", {
      enabled: true,
      color: "#ff0000",
      height: 6,
      position: "bottom",
    });

    expect(getSiteState(settings, "https://example.com").settings).toEqual({
      enabled: true,
      color: "#ff0000",
      height: 6,
      position: "bottom",
    });
    expect(getSiteState(settings, "https://other.com").settings).toEqual({
      enabled: true,
      color: "#60a5fa",
      height: 3,
      position: "top",
    });
  });
});
