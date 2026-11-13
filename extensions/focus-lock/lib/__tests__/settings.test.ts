import { describe, expect, it } from "vitest";
import { addDomain, normalizeDomainList, removeDomain } from "../domains";
import { hashPassword, timingSafeEqual, verifyPassword } from "../password";
import { normalizeDomain, validateFocusLockSettings } from "../types";

describe("focus lock", () => {
  it("normalizes domains", () => {
    expect(normalizeDomain("https://WWW.Example.com/path")).toBe("www.example.com");
    expect(addDomain([], "example.com")).toEqual(["example.com"]);
    expect(() => addDomain([], "not a domain")).toThrow();
    expect(removeDomain(["example.com"], "https://example.com/")).toEqual([]);
  });

  it("imports only valid domains", () => {
    expect(normalizeDomainList(["a.example", "https://b.example/", 42, "bad"])).toEqual([
      "a.example",
      "b.example",
    ]);
  });

  it("validates stored settings", () => {
    const settings = validateFocusLockSettings({
      domains: ["example.com", "example.com"],
      unlockedUntil: {
        "example.com": 123,
        bad: "no",
      },
      failedAttempts: "bad",
    });

    expect(settings.domains).toEqual(["example.com"]);
    expect(settings.unlockedUntil).toEqual({
      "example.com": 123,
    });
    expect(settings.failedAttempts).toBe(0);
  });

  it("hashes and verifies passwords", async () => {
    const { hash, salt } = await hashPassword("correct horse");
    expect(await verifyPassword("correct horse", hash, salt)).toBe(true);
    expect(await verifyPassword("wrong horse", hash, salt)).toBe(false);
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
  });
});
