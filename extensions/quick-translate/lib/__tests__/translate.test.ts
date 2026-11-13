import { describe, expect, it } from "vitest";
import { isRtlLanguage, validateTranslateSettings } from "../types";
import { parseGoogleTranslateResponse, truncateTranslationText } from "../translate";

describe("quick translate", () => {
  it("truncates text", () => {
    expect(truncateTranslationText("abcdef", 3)).toBe("abc...");
  });

  it("parses Google Translate responses", () => {
    expect(
      parseGoogleTranslateResponse([
        [
          ["Hola", "Hello", null, null],
          ["mundo", "world", null, null],
        ],
        null,
        "en",
      ]),
    ).toEqual({
      text: "Holamundo",
      sourceLanguage: "en",
    });
  });

  it("rejects malformed responses", () => {
    expect(() => parseGoogleTranslateResponse({})).toThrow();
  });

  it("detects RTL output languages and validates settings", () => {
    expect(isRtlLanguage("ar")).toBe(true);
    expect(isRtlLanguage("en")).toBe(false);
    expect(
      validateTranslateSettings({
        targetLanguage: 12,
        timeoutMs: 10,
      }),
    ).toEqual({
      schemaVersion: 1,
      provider: "google",
      targetLanguage: "en",
      timeoutMs: 6000,
    });
  });
});
