import { browser } from "wxt/browser";
import { createStatusView } from "@hub/shared/ui";
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
const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));

const storage = browser.storage.session;
const operations: AnnotationOperation[] = [];
let settings: AnnotationSettings = annotationDefaults;
let startPoint: Point | null = null;
let draftOperation: AnnotationOperation | null = null;
let pendingTextPoint: Point | null = null;
let baseImageDataUrl: string | null = null;

function toCanvasPoint(event: MouseEvent): Point {
  const rect = canvas?.getBoundingClientRect() ?? new DOMRect(0, 0, 0, 0);

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function drawDraft(): void {
  if (!draftOperation) {
    return;
  }

  const context = canvas?.getContext("2d");

  if (context) {
    drawAnnotation(context, draftOperation);
  }
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

  drawDraft();
}

async function loadImage(): Promise<void> {
  if (!canvas) {
    return;
  }

  const result = await storage.get("screenshot-annotator.capture");
  const storedDataUrl = result["screenshot-annotator.capture"];

  if (typeof storedDataUrl === "string") {
    baseImageDataUrl = storedDataUrl;
    await storage.remove("screenshot-annotator.capture");
  }

  if (!baseImageDataUrl) {
    statusView.set("No screenshot found. Capture one from the popup.", true);
    return;
  }

  const image = new Image();

  image.onload = () => {
    const maxWidth = Math.min(1000, window.innerWidth - 64);
    const scale = Math.min(1, maxWidth / image.width);
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext("2d");
    context?.drawImage(image, 0, 0, canvas.width, canvas.height);
    statusView.set("Loaded. Drag to annotate. Press Esc to cancel and Ctrl/Cmd+Z to undo.");
  };
  image.src = baseImageDataUrl;
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

  if (!canvas || !baseImageDataUrl) {
    return;
  }

  const image = new Image();

  image.onload = () => {
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    operations.forEach((operation) => {
      drawAnnotation(context, operation);
    });
  };
  image.src = baseImageDataUrl;
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
    statusView.set("Copied image.");
  } catch (error) {
    statusView.set(error instanceof Error ? error.message : "Copy failed.", true);
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
  statusView.set("Downloaded.");
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
    pendingTextPoint = endPoint;
    const dialog = document.querySelector<HTMLDivElement>("#text-dialog");
    const input = document.querySelector<HTMLInputElement>("#annotation-text");

    if (dialog && input) {
      dialog.removeAttribute("hidden");
      input.value = "";
      input.focus();
    }

    startPoint = null;
    return;
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
  draftOperation = null;
  redraw();
});

canvas?.addEventListener("mousemove", (event) => {
  if (!startPoint) {
    return;
  }

  const point = toCanvasPoint(event as MouseEvent);

  if (settings.tool === "brush") {
    draftOperation = {
      type: "brush",
      start: startPoint,
      end: point,
      color: settings.color,
      strokeWidth: settings.strokeWidth,
    };
    startPoint = point;
    redraw();
    return;
  }

  if (settings.tool === "rectangle" || settings.tool === "arrow") {
    draftOperation = {
      type: settings.tool,
      start: startPoint,
      end: point,
      color: settings.color,
      strokeWidth: settings.strokeWidth,
    };
    redraw();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    startPoint = null;
    draftOperation = null;
    redraw();
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    void undo();
  }
});

async function saveTextAnnotation(): Promise<void> {
  const input = document.querySelector<HTMLInputElement>("#annotation-text");
  const dialog = document.querySelector<HTMLDivElement>("#text-dialog");
  const text = input?.value.trim();

  if (!pendingTextPoint || !text || !canvas) {
    dialog?.setAttribute("hidden", "");
    pendingTextPoint = null;
    return;
  }

  operations.push({
    type: "text",
    start: pendingTextPoint,
    end: pendingTextPoint,
    text,
    color: settings.color,
    strokeWidth: settings.strokeWidth,
  });
  pendingTextPoint = null;
  dialog?.setAttribute("hidden", "");
  redraw();
}

document.querySelector<HTMLButtonElement>("#save-text")?.addEventListener("click", () => {
  void saveTextAnnotation();
});

document
  .querySelector<HTMLInputElement>("#annotation-text")
  ?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void saveTextAnnotation();
    }
  });

void loadSettings();
void loadImage();
