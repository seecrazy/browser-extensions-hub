import { sendTabMessage } from "@hub/shared/messaging";
import "@hub/shared/ui/styles.css";
import { browser } from "wxt/browser";

type VolumeState = {
  level: number;
  mediaCount: number;
  unsupportedCount: number;
};

const volumeInput = document.querySelector<HTMLInputElement>("#volume");
const valueLabel = document.querySelector<HTMLParagraphElement>("#value");
const status = document.querySelector<HTMLParagraphElement>("#status");

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
    files: ["/content-scripts/volume-booster.js"],
  });
}

async function loadVolume(): Promise<void> {
  const tabId = await getActiveTabId();

  if (!tabId || !volumeInput || !valueLabel) {
    setStatus("No active tab available.", true);
    return;
  }

  try {
    await injectContentScript(tabId);
    const response = await sendTabMessage<"VOLUME_GET", VolumeState>(tabId, {
      type: "VOLUME_GET",
    });

    if (!response.ok) {
      setStatus(response.error.message, true);
      return;
    }

    volumeInput.value = String(response.data.level);
    valueLabel.textContent = `${response.data.level}%`;

    if (response.data.mediaCount === 0) {
      setStatus("No media element found in the main frame.");
      return;
    }

    if (response.data.unsupportedCount > 0) {
      setStatus(
        `${response.data.unsupportedCount} media element(s) cannot boost above 100% because they are cross-origin without CORS.`,
      );
      return;
    }

    setStatus("Connected. Interact with the page if audio is muted.");
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
  const response = await sendTabMessage<"VOLUME_SET", VolumeState>(tabId, {
    type: "VOLUME_SET",
    payload: {
      level,
    },
  });

  if (!response.ok) {
    setStatus(response.error.message, true);
    return;
  }

  if (response.data.mediaCount === 0) {
    setStatus("No media element found in the main frame.");
    return;
  }

  if (response.data.unsupportedCount > 0) {
    setStatus(
      `${response.data.unsupportedCount} media element(s) cannot boost above 100% because they are cross-origin without CORS.`,
    );
    return;
  }

  setStatus("Applied.");
}

volumeInput?.addEventListener("input", () => {
  void setVolume(Number(volumeInput.value));
});

void loadVolume();
