import { createTabMessageSender } from "@hub/shared/messaging";
import { browser } from "wxt/browser";
import "@hub/shared/ui/styles.css";
import { volumeMessages } from "../../lib/messages";
import type { VolumeMediaState } from "../../lib/types";

const volumeInput = document.querySelector<HTMLInputElement>("#volume");
const valueLabel = document.querySelector<HTMLParagraphElement>("#value");
const status = document.querySelector<HTMLParagraphElement>("#status");
const sendMessage = createTabMessageSender(volumeMessages);

function setStatus(message: string, isError = false): void {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("hub-status-error", isError);
}

function renderState(state: VolumeMediaState): void {
  if (volumeInput && valueLabel) {
    volumeInput.value = String(state.level);
    valueLabel.textContent = `${state.level}%`;
  }

  if (state.mediaCount === 0) {
    setStatus("No media element found in the main frame.");
    return;
  }

  const audioText =
    state.audioContextState === "suspended" ? " Interact with the page to resume audio." : "";
  const unsupportedText =
    state.unsupportedCount > 0
      ? ` ${state.unsupportedCount} media element(s) cannot boost above 100% because they are cross-origin without CORS.`
      : "";
  setStatus(`Connected.${audioText}${unsupportedText}`);
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
    files: ["/content-scripts/volume-booster.js"],
  });
}

async function loadVolume(): Promise<void> {
  const tabId = await getActiveTabId();

  if (!tabId || !volumeInput || !valueLabel || !status) {
    setStatus("No active tab available.", true);
    return;
  }

  try {
    await injectContentScript(tabId);
    const response = await sendMessage(tabId, {
      type: "VOLUME_GET",
    });

    if (!response.ok) {
      setStatus(response.error.message, true);
      return;
    }

    renderState(response.data);
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "This tab cannot use Volume Booster Lite.",
      true,
    );
  }
}

async function setVolume(level: number): Promise<void> {
  const tabId = await getActiveTabId();

  if (!tabId || !valueLabel) {
    setStatus("No active tab available.", true);
    return;
  }

  valueLabel.textContent = `${level}%`;
  const response = await sendMessage(tabId, {
    type: "VOLUME_SET",
    payload: {
      level,
    },
  });

  if (!response.ok) {
    setStatus(response.error.message, true);
    return;
  }

  renderState(response.data);
}

volumeInput?.addEventListener("input", () => {
  void setVolume(Number(volumeInput.value));
});

void loadVolume();
