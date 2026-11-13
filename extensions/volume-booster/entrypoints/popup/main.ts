import { getActiveTab, injectRuntimeContentScript } from "@hub/shared/injection";
import { createTabMessageSender } from "@hub/shared/messaging";
import { createStatusView } from "@hub/shared/ui";
import "@hub/shared/ui/styles.css";
import { volumeMessages } from "../../lib/messages";
import type { VolumeMediaState } from "../../lib/types";

const volumeInput = document.querySelector<HTMLInputElement>("#volume");
const valueLabel = document.querySelector<HTMLParagraphElement>("#value");
const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));
const sendMessage = createTabMessageSender(volumeMessages);

function renderState(state: VolumeMediaState): void {
  if (volumeInput && valueLabel) {
    volumeInput.value = String(state.level);
    valueLabel.textContent = `${state.level}%`;
  }

  if (state.mediaCount === 0) {
    statusView.set("No media element found in the main frame.");
    return;
  }

  const audioText =
    state.audioContextState === "suspended" ? " Interact with the page to resume audio." : "";
  const unsupportedText =
    state.unsupportedCount > 0
      ? ` ${state.unsupportedCount} media element(s) cannot boost above 100% because they are cross-origin without CORS.`
      : "";
  statusView.set(`Connected.${audioText}${unsupportedText}`);
}

async function getActiveTabId(): Promise<number | null> {
  return (await getActiveTab()).tabId ?? null;
}

async function loadVolume(): Promise<void> {
  const tabId = await getActiveTabId();

  if (!tabId || !volumeInput || !valueLabel) {
    statusView.set("No active tab available.", true);
    return;
  }

  try {
    await injectRuntimeContentScript({
      file: "/content-scripts/volume-booster.js",
    });
    const response = await sendMessage(tabId, {
      type: "VOLUME_GET",
    });

    if (!response.ok) {
      statusView.set(response.error.message, true);
      return;
    }

    renderState(response.data);
  } catch (error) {
    statusView.set(
      error instanceof Error ? error.message : "This tab cannot use Volume Booster Lite.",
      true,
    );
  }
}

async function setVolume(level: number): Promise<void> {
  const tabId = await getActiveTabId();

  if (!tabId || !valueLabel) {
    statusView.set("No active tab available.", true);
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
    statusView.set(response.error.message, true);
    return;
  }

  renderState(response.data);
}

volumeInput?.addEventListener("input", () => {
  void setVolume(Number(volumeInput.value));
});

void loadVolume();
