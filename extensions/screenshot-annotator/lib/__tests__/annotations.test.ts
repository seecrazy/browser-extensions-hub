import { describe, expect, it } from "vitest";
import { createOperation } from "../annotations";
import {
  annotationDefaults,
  normalizeColor,
  normalizeStrokeWidth,
  normalizeTool,
  validateAnnotationSettings,
} from "../types";

describe("screenshot annotator", () => {
  it("normalizes annotation settings", () => {
    expect(normalizeColor("#ABCDEF")).toBe("#abcdef");
    expect(normalizeColor("red")).toBe("#dc2626");
    expect(normalizeStrokeWidth(0)).toBe(1);
    expect(normalizeStrokeWidth(100)).toBe(16);
    expect(normalizeTool("arrow")).toBe("arrow");
    expect(normalizeTool("spray")).toBe("rectangle");
    expect(
      validateAnnotationSettings({
        color: "#00ff00",
        strokeWidth: 8,
        tool: "text",
      }),
    ).toEqual({
      schemaVersion: 1,
      color: "#00ff00",
      strokeWidth: 8,
      tool: "text",
    });
  });

  it("creates rectangle and text operations", () => {
    const rectangle = createOperation(
      "rectangle",
      annotationDefaults,
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    );
    const text = createOperation(
      "text",
      annotationDefaults,
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      "Note",
    );

    expect(rectangle).toMatchObject({ type: "rectangle", color: "#dc2626", strokeWidth: 4 });
    expect(text.text).toBe("Note");
  });

  it("creates arrow and text operations without optional text", () => {
    const arrow = createOperation("arrow", annotationDefaults, { x: 0, y: 0 }, { x: 40, y: 30 });
    const text = createOperation("text", annotationDefaults, { x: 0, y: 0 }, { x: 40, y: 30 });

    expect(arrow).toMatchObject({ type: "arrow", start: { x: 0, y: 0 }, end: { x: 40, y: 30 } });
    expect(text).not.toHaveProperty("text");
  });
});
