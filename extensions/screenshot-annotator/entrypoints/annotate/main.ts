import { browser } from "wxt/browser";
import "@hub/shared/ui/styles.css";
import { drawAnnotation } from "../../lib/annotations";
import type { AnnotationOperation, Point } from "../../lib/annotations";
import {
  annotationDefaults,
  normalizeColor,
  normalizeStrokeWidth,
  normalizeTool,
  validateAnnotationSettings,
} from "../../lib/types";
import type { AnnotationSettings } from "../../lib/types";

const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
const toolInput = document.querySelector<HTMLSelectElement>("#tool");
const colorInput = document.querySelector<HTMLInputElement>("#color");
const widthInput = document.querySelector<HTMLInputElement>("#width");
const undoButton = document.querySelector<HTMLButtonElement>("#undo");
const copyButton = document.querySelector<HTMLButtonElement>("#copy");
const downloadButton = document.querySelector<HTMLButtonElement>("#download");
const status = document.querySelector<HTMLParagraphElement>("#status");

const storage = browser.storage.session;
const operations: AnnotationOperation[] = [];
let settings: AnnotationSettings = annotationDefaults;
let startPoint: Point | null = null;

function setStatus(message: string, isError = false): void {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("hub-status-error", isError);
}

function toCanvasPoint(event: MouseEvent): Point {
  const rect = canvas?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0);

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function redraw(): void {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(canvas, 0, 0);

  for (const operation of operations) {
    drawAnnotation(context, operation);
  }
}

async function loadImage(): Promise<void> {
  const result = await storage.get("screenshot-annotator.capture");
  const dataUrl = result["screenshot-annotator.capture"];

  if (!canvas || typeof dataUrl !== "string") {
    setStatus("No screenshot found. Capture one from the popup.", true);
    return;
  }

  const image = new Image();

  image.onload = () => {
    if (!canvas) {
      return;
    }

    const maxWidth = Math.min(1000, window.innerWidth - 64);
    const scale = Math.min(1, maxWidth / image.width);
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext("2d");
    context?.drawImage(image, 0, 0, canvas.width, canvas.height);
    setStatus("Loaded. Drag to annotate.");
  };
  image.src = dataUrl;
}

async function loadSettings(): Promise<void> {
  const result = await browser.storage.local.get("screenshot-annotator.settings");
  const normalized = validateAnnotationSettings(result["screenshot-annotator.settings"]);
  settings = normalized;

  if (toolInput) toolInput.value = settings.tool;
  if (colorInput) colorInput.value = settings.color;
  if (widthInput) widthInput.value = String(settings.strokeWidth);
}

async function saveSettings(): Promise<void> {
  await browser.storage.local.set({
    "screenshot-annotator.settings": settings,
  });
}

async function undo(): Promise<void> {
  operations.pop();
  await loadImage();
  operations.forEach((operation) => {
    const context = canvas?.getContext("2d");

    if (context) {
      drawAnnotation(context, operation);
    }
  });
}

async function copyImage(): Promise<void> {
  if (!canvas) {
    return;
  }

  try {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));

    if (!blob) {
      throw new Error("Unable to create PNG.");
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);
    setStatus("Copied image.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Copy failed.", true);
  }
}

async function downloadImage(): Promise<void> {
  if (!canvas) {
    return;
  }

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `screenshot-annotator-${Date.now()}.png`;
  link.click();
  setStatus("Downloaded.");
}

toolInput?.addEventListener("change", async () => {
  settings = {
    ...settings,
    tool: normalizeTool(toolInput.value),
  };
  await saveSettings();
});

colorInput?.addEventListener("input", async () => {
  settings = {
    ...settings,
    color: normalizeColor(colorInput.value),
  };
  await saveSettings();
});

widthInput?.addEventListener("input", async () => {
  settings = {
    ...settings,
    strokeWidth: normalizeStrokeWidth(Number(widthInput.value)),
  };
  await saveSettings();
});

undoButton?.addEventListener("click", () => {
  void undo();
});

copyButton?.addEventListener("click", () => {
  void copyImage();
});

downloadButton?.addEventListener("click", () => {
  void downloadImage();
});

canvas?.addEventListener("mousedown", (event) => {
  startPoint = toCanvasPoint(event as MouseEvent);
});

canvas?.addEventListener("mouseup", async (event) => {
  if (!startPoint) {
    return;
  }

  const endPoint = toCanvasPoint(event as MouseEvent);
  let text: string | undefined;

  if (settings.tool === "text") {
    text = window.prompt("Annotation text") ?? "";
    startPoint = endPoint;

    if (!text) {
      startPoint = null;
      return;
    }
  }

  operations.push({
    type: settings.tool,
    start: startPoint,
    end: endPoint,
    ...(text ? { text } : {}),
    color: settings.color,
    strokeWidth: settings.strokeWidth,
  });
  startPoint = null;
  redraw();
});

void loadSettings();
void loadImage();
