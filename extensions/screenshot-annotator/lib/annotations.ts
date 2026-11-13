import type { AnnotationSettings } from "./types";

export type Point = {
  x: number;
  y: number;
};

export type AnnotationOperation = {
  type: "rectangle" | "arrow" | "text" | "brush";
  start: Point;
  end: Point;
  text?: string;
  color: string;
  strokeWidth: number;
};

export function createOperation(
  tool: AnnotationSettings["tool"],
  settings: AnnotationSettings,
  start: Point,
  end: Point,
  text?: string,
): AnnotationOperation {
  return {
    type: tool,
    start,
    end,
    ...(text ? { text } : {}),
    color: settings.color,
    strokeWidth: settings.strokeWidth,
  };
}

export function drawAnnotation(
  context: CanvasRenderingContext2D,
  operation: AnnotationOperation,
): void {
  context.save();
  context.strokeStyle = operation.color;
  context.fillStyle = operation.color;
  context.lineWidth = operation.strokeWidth;
  context.lineCap = "round";

  if (operation.type === "rectangle") {
    const x = Math.min(operation.start.x, operation.end.x);
    const y = Math.min(operation.start.y, operation.end.y);
    const width = Math.abs(operation.end.x - operation.start.x);
    const height = Math.abs(operation.end.y - operation.start.y);
    context.strokeRect(x, y, width, height);
  }

  if (operation.type === "brush") {
    context.beginPath();
    context.moveTo(operation.start.x, operation.start.y);
    context.lineTo(operation.end.x, operation.end.y);
    context.stroke();
  }

  if (operation.type === "arrow") {
    const angle = Math.atan2(
      operation.end.y - operation.start.y,
      operation.end.x - operation.start.x,
    );
    const headLength = Math.max(10, operation.strokeWidth * 3);
    context.beginPath();
    context.moveTo(operation.start.x, operation.start.y);
    context.lineTo(operation.end.x, operation.end.y);
    context.stroke();
    context.beginPath();
    context.moveTo(operation.end.x, operation.end.y);
    context.lineTo(
      operation.end.x - headLength * Math.cos(angle - Math.PI / 6),
      operation.end.y - headLength * Math.sin(angle - Math.PI / 6),
    );
    context.lineTo(
      operation.end.x - headLength * Math.cos(angle + Math.PI / 6),
      operation.end.y - headLength * Math.sin(angle + Math.PI / 6),
    );
    context.closePath();
    context.fill();
  }

  if (operation.type === "text" && operation.text) {
    const fontSize = Math.max(16, operation.strokeWidth * 5);
    context.font = `${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    context.fillText(operation.text, operation.start.x, operation.start.y);
  }

  context.restore();
}
