import { describe, expect, it } from "vitest";
import {
  addShortcut,
  addTodo,
  clearCompleted,
  removeShortcut,
  removeTodo,
  toggleTodo,
} from "../settings";
import { dashboardDefaults, safeUrl, validateDashboardSettings } from "../types";

describe("new tab dashboard", () => {
  it("validates and normalizes URLs", () => {
    expect(safeUrl("example.com/path")).toBe("https://example.com/path");
    expect(() => safeUrl("javascript:alert(1)")).toThrow();
  });

  it("adds and toggles todos", () => {
    const settings = addTodo(dashboardDefaults, "Write tests");
    const item = settings.todos[0];

    expect(item?.text).toBe("Write tests");
    expect(toggleTodo(settings, item?.id ?? "").todos[0]?.done).toBe(true);
    expect(removeTodo(settings, item?.id ?? "").todos).toHaveLength(0);
    const toggled = toggleTodo(settings, item?.id ?? "");
    expect(clearCompleted(toggled).todos).toHaveLength(0);
  });

  it("adds only http and https shortcuts", () => {
    const settings = addShortcut(dashboardDefaults, "Example", "example.com");

    expect(settings.shortcuts.at(-1)?.url).toBe("https://example.com/");
    expect(() => addShortcut(dashboardDefaults, "Bad", "javascript:alert(1)")).toThrow();
    expect(removeShortcut(settings, settings.shortcuts.at(-1)?.id ?? "").shortcuts).toHaveLength(
      dashboardDefaults.shortcuts.length,
    );
  });

  it("sanitizes stored settings", () => {
    const settings = validateDashboardSettings({
      todos: [{ text: "Keep", done: true }, { text: "" }],
      shortcuts: [{ url: "example.com", label: "Example" }, { url: "javascript:alert(1)" }],
    });

    expect(settings.todos).toHaveLength(1);
    expect(settings.shortcuts).toHaveLength(1);
  });
});
