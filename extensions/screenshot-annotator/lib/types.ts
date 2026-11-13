export type AnnotationTool = "rectangle" | "arrow" | "text";

export type AnnotationSettings = {
  schemaVersion: 1;
  color: string;
  strokeWidth: number;
  tool: AnnotationTool;
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export const annotationDefaults: AnnotationSettings = {
  schemaVersion: 1,
  color: "#dc2626",
  strokeWidth: 4,
  tool: "rectangle",
};

export function normalizeColor(value: unknown): string {
  return typeof value === "string" && HEX_COLOR.test(value) ? value.toLowerCase() : "#dc2626";
}

export function normalizeStrokeWidth(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 4;
  }

  return Math.min(16, Math.max(1, Math.round(value)));
}

export function normalizeTool(value: unknown): AnnotationTool {
  return value === "arrow" || value === "text" ? value : "rectangle";
}

export function validateAnnotationSettings(value: unknown): AnnotationSettings {
  const record =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return {
    schemaVersion: 1,
    color: normalizeColor(record.color),
    strokeWidth: normalizeStrokeWidth(record.strokeWidth),
    tool: normalizeTool(record.tool),
  };
}
