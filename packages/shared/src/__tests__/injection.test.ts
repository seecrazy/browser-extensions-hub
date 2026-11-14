import { describe, expect, it } from "vitest";
import { getInjectionErrorMessage, isInjectableUrl } from "../injection";

describe("runtime injection URL checks", () => {
  it("allows only http and https pages", () => {
    expect(isInjectableUrl("https://example.com/page")).toBe(true);
    expect(isInjectableUrl("http://localhost:3000/page")).toBe(true);
    expect(isInjectableUrl("chrome://new-tab-page/")).toBe(false);
    expect(isInjectableUrl("chrome-extension://abc/popup.html")).toBe(false);
    expect(isInjectableUrl("about:blank")).toBe(false);
    expect(isInjectableUrl(undefined)).toBe(false);
  });

  it("converts browser-page access errors into actionable messages", () => {
    const error = new Error("Cannot access a chrome:// URL");

    expect(getInjectionErrorMessage(error, "chrome://new-tab-page/")).toBe(
      "This page type cannot be modified. Open an http or https website.",
    );
    expect(getInjectionErrorMessage(new Error("Network failed"), "https://example.com")).toBe(
      "Network failed",
    );
  });
});
