// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { createAdvancedSettings, createDisclosure } from "../index";

describe("createDisclosure", () => {
  it("creates a collapsed native disclosure", () => {
    const label = document.createElement("span");
    label.textContent = "Hidden";
    const { root, summary, content, isOpen } = createDisclosure({
      label: "Advanced settings",
      children: [label],
    });

    expect(root.tagName).toBe("DETAILS");
    expect(root.open).toBe(false);
    expect(isOpen).toBe(false);
    expect(summary.textContent).toBe("Advanced settings");
    expect(content.contains(label)).toBe(true);
    expect(content.textContent).toBe("Hidden");
  });

  it("supports an initially open state and imperative updates", () => {
    const item = document.createElement("input");
    const disclosure = createDisclosure({
      label: "Advanced",
      children: [item],
      defaultOpen: true,
    });

    expect(disclosure.isOpen).toBe(true);
    disclosure.setOpen(false);
    expect(disclosure.root.open).toBe(false);
    disclosure.setOpen(true);
    expect(disclosure.root.open).toBe(true);
    expect(disclosure.content.contains(item)).toBe(true);
  });
});

describe("createAdvancedSettings", () => {
  it("uses the advanced visual class and default label", () => {
    const child = document.createElement("select");
    const disclosure = createAdvancedSettings([child]);

    expect(disclosure.root.classList.contains("hub-advanced")).toBe(true);
    expect(disclosure.summary.textContent).toBe("Advanced settings");
    expect(disclosure.content.contains(child)).toBe(true);
    expect(disclosure.root.open).toBe(false);
  });

  it("supports custom labels and initial expansion", () => {
    const child = document.createElement("input");
    const disclosure = createAdvancedSettings([child], {
      label: "Appearance",
      defaultOpen: true,
    });

    expect(disclosure.summary.textContent).toBe("Appearance");
    expect(disclosure.root.open).toBe(true);
  });
});
