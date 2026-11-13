import { describe, expect, it } from "vitest";
import {
  addClipboardItem,
  clearClipboardHistory,
  normalizeClipboardText,
  removeClipboardItem,
  searchClipboardHistory,
} from "../types";

describe("clipboard history", () => {
  it("normalizes and limits copied text", () => {
    expect(normalizeClipboardText("a b")).toBe("a b");
    expect(normalizeClipboardText(42)).toBe("");
    expect(normalizeClipboardText("x".repeat(11_000)).length).toBe(10_000);
  });

  it("moves duplicates to the top instead of growing history", () => {
    const first = addClipboardItem({ schemaVersion: 1, history: [] }, "hello");
    const second = addClipboardItem(first, "world");
    const third = addClipboardItem(second, "hello");

    expect(third.history.map((item) => item.text)).toEqual(["hello", "world"]);
    expect(third.history).toHaveLength(2);
  });

  it("supports remove, clear, and search", () => {
    const first = addClipboardItem({ schemaVersion: 1, history: [] }, "important note");
    const second = addClipboardItem(first, "other text");
    const item = second.history[0];

    expect(searchClipboardHistory(second, "important")).toHaveLength(1);
    expect(removeClipboardItem(second, item?.id ?? "").history).toHaveLength(1);
    expect(clearClipboardHistory(second).history).toHaveLength(0);
  });
});
