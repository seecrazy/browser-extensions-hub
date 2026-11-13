import { describe, expect, it } from "vitest";
import { getSiteLevel, patchSiteLevel } from "../settings";
import { normalizeLevel, volumeDefaults } from "../types";

describe("volume settings", () => {
  it("normalizes levels", () => {
    expect(normalizeLevel(-5)).toBe(0);
    expect(normalizeLevel(150)).toBe(150);
    expect(normalizeLevel(500)).toBe(300);
    expect(normalizeLevel("bad")).toBe(100);
  });

  it("uses per-site levels", () => {
    const patched = patchSiteLevel(volumeDefaults, "https://video.example", 250);

    expect(getSiteLevel(patched, "https://video.example")).toBe(250);
    expect(getSiteLevel(patched, "https://other.example")).toBe(100);
  });
});
