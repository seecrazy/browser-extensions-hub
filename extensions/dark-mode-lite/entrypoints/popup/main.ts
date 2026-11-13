import { createTabMessageSender } from "@hub/shared/messaging";
import { browser } from "wxt/browser";
import "@hub/shared/ui/styles.css";
import { darkModeMessages } from "../../lib/messages";
import type { DarkModeSiteState } from "../../lib/types";

const enabledInput = document.querySelector<HTMLInputElement>("#enabled");
const strengthInput = document.querySelector<HTMLInputElement>("#strength");
const siteLabel = document.querySelector<HTMLParagraphElement>("#site");
const status = document.querySelector<HTMLParagraphElement>("#status");
const sendMessage = createTabMessageSender(darkModeMessages);

function setStatus(message: string, isError = false): void {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("hub-status-error", isError);
}

async function getActiveTabId(): Promise<number | null> {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tab?.id ?? null;
}

async function injectContentScript(tabId: number): Promise<void> {
  await browser.scripting.executeScript({
    target: {
      tabId,
    },
    files: ["/content-scripts/dark-mode.js"],
  });
}

function renderState(state: DarkModeSiteState): void {
  if (!enabledInput || !strengthInput || !siteLabel) {
    return;
  }

  siteLabel.textContent = state.origin || "Current site";
  enabledInput.checked = state.settings.enabled;
  strengthInput.value = String(state.settings.strength);
}

async function loadSettings(): Promise<void> {
  const tabId = await getActiveTabId();

  if (!tabId || !enabledInput || !strengthInput || !status) {
    setStatus("No active tab available.", true);
    return;
  }

  try {
    await injectContentScript(tabId);
    const response = await sendMessage(tabId, {
      type: "DARK_MODE_GET_SITE_STATE",
    });

    if (!response.ok) {
      setStatus(response.error.message, true);
      return;
    }

    renderState(response.data);
    setStatus("Connected to current tab.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "This tab cannot use Dark Mode Lite.", true);
  }
}

async function saveSettings(patch: { enabled?: boolean; strength?: number }): Promise<void> {
  const tabId = await getActiveTabId();

  if (!tabId) {
    setStatus("No active tab available.", true);
    return;
  }

  const response = await sendMessage(tabId, {
    type: "DARK_MODE_SET_SITE_STATE",
    payload: patch,
  });

  if (!response.ok) {
    setStatus(response.error.message, true);
    return;
  }

  renderState(response.data);
}

enabledInput?.addEventListener("change", () => {
  void saveSettings({
    enabled: enabledInput.checked,
  });
});

strengthInput?.addEventListener("input", () => {
  void saveSettings({
    strength: Number(strengthInput.value),
  });
});

void loadSettings();
