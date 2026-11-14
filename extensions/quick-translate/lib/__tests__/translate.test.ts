import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseTranslationResponse,
  truncateTranslationText,
  translate,
  TRANSLATION_ENDPOINTS,
} from "../translate";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("quick translate translation", () => {
  it("truncates selected text", () => {
    expect(truncateTranslationText("abcdef", 3)).toBe("abc...");
  });

  it("parses successful Google responses", () => {
    expect(
      parseTranslationResponse([
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

  it("rejects malformed and empty responses", () => {
    expect(() => parseTranslationResponse({})).toThrow();
    expect(() => parseTranslationResponse([[]])).toThrow(
      "Translation service returned empty text.",
    );
  });

  it("falls back to the second endpoint when the first times out", async () => {
    vi.useFakeTimers();
    const urls: string[] = [];
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      urls.push(String(input));

      if (urls.length === 1) {
        return new Promise<Response>(() => undefined);
      }

      return Response.json([[["Hola", "Hello", null, null]], null, "en"]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const pending = translate({
      text: "Hello",
      targetLanguage: "es",
      timeoutMs: 1000,
    });
    await vi.advanceTimersByTimeAsync(1000);
    await expect(pending).resolves.toEqual({ text: "Hola", sourceLanguage: "en" });

    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain(TRANSLATION_ENDPOINTS[0]);
    expect(urls[1]).toContain(TRANSLATION_ENDPOINTS[1]);
  });

  it("reports a timeout after every endpoint fails", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Promise<Response>(() => undefined)),
    );

    const pending = translate({
      text: "Hello",
      targetLanguage: "es",
      timeoutMs: 1000,
    });
    const expectation = expect(pending).rejects.toThrow(
      "Translation request timed out after 1000ms.",
    );
    await vi.advanceTimersByTimeAsync(2000);
    await expectation;
  });
});
