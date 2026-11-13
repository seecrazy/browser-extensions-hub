import { createTabMessageSender } from "@hub/shared/messaging";
import { browser } from "wxt/browser";
import "@hub/shared/ui/styles.css";
import { readingProgressMessages } from "../../lib/messages";
import type { ReadingProgressSiteState } from "../../lib/types";

const originLabel = document.querySelector<HTMLParagraphElement>("#origin");
const enabledInput = document.querySelector<HTMLInputElement>("#enabled");
const colorInput = document.querySelector<HTMLInputElement>("#color");
const heightInput = document.querySelector<HTMLInputElement>("#height");
const positionInput = document.querySelector<HTMLSelectElement>("#position");
const status = document.querySelector<HTMLParagraphElement>("#status");
const sendMessage = createTabMessageSender(readingProgressMessages);

function setStatus(message: string, isError = false): void {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("hub-status-error", isError);
}

function renderState(state: ReadingProgressSiteState): void {
  if (originLabel) {
    originLabel.textContent = state.origin || "Current site";
  }

  if (enabledInput) enabledInput.checked = state.settings.enabled;
  if (colorInput) colorInput.value = state.settings.color;
  if (heightInput) heightInput.value = String(state.settings.height);
  if (positionInput) positionInput.value = state.settings.position;
}

async function injectContentScript(tabId: number): Promise<void> {
  await browser.scripting.executeScript({
    target: {
      tabId,
    },
    files: ["/content-scripts/reading-progress.js"],
  });
}

async function loadState(): Promise<void> {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab?.id || !enabledInput || !colorInput || !heightInput || !positionInput || !status) {
    setStatus("No active tab available.", true);
    return;
  }

  try {
    await injectContentScript(tab.id);
    const response = await sendMessage(tab.id, {
      type: "READING_PROGRESS_GET_SITE_STATE",
    });

    if (!response.ok) {
      setStatus(response.error.message, true);
      return;
    }

    renderState(response.data);
    setStatus("Connected to current tab.");
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "This tab cannot use Reading Progress.",
      true,
    );
  }
}

async function saveState(patch: {
  enabled?: boolean;
  color?: string;
  height?: number;
  position?: "top" | "bottom";
}): Promise<void> {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab?.id || !status) {
    setStatus("No active tab available.", true);
    return;
  }

  const response = await sendMessage(tab.id, {
    type: "READING_PROGRESS_SET_SITE_STATE",
    payload: patch,
  });

  if (!response.ok) {
    setStatus(response.error.message, true);
    return;
  }

  renderState(response.data);
  setStatus("Saved.");
}

enabledInput?.addEventListener("change", () => {
  void saveState({
    enabled: enabledInput.checked,
  });
});

colorInput?.addEventListener("input", () => {
  void saveState({
    color: colorInput.value,
  });
});

heightInput?.addEventListener("input", () => {
  void saveState({
    height: Number(heightInput.value),
  });
});

positionInput?.addEventListener("change", () => {
  void saveState({
    position: positionInput.value === "bottom" ? "bottom" : "top",
  });
});

void loadState();
