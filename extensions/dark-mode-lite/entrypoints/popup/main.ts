import { getActiveTab, injectRuntimeContentScript } from "@hub/shared/injection";
import { createTabMessageSender } from "@hub/shared/messaging";
import { createStatusView } from "@hub/shared/ui";
import "@hub/shared/ui/styles.css";
import { darkModeMessages } from "../../lib/messages";
import type { DarkModeSiteState } from "../../lib/types";

const enabledInput = document.querySelector<HTMLInputElement>("#enabled");
const strengthInput = document.querySelector<HTMLInputElement>("#strength");
const siteLabel = document.querySelector<HTMLParagraphElement>("#site");
const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));
const sendMessage = createTabMessageSender(darkModeMessages);

async function getActiveTabId(): Promise<number | null> {
  return (await getActiveTab()).tabId ?? null;
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

  if (!tabId || !enabledInput || !strengthInput) {
    statusView.set("No active tab available.", true);
    return;
  }

  try {
    await injectRuntimeContentScript({
      file: "/content-scripts/dark-mode.js",
    });
    const response = await sendMessage(tabId, {
      type: "DARK_MODE_GET_SITE_STATE",
    });

    if (!response.ok) {
      statusView.set(response.error.message, true);
      return;
    }

    renderState(response.data);
    statusView.set("Connected to current tab.");
  } catch (error) {
    statusView.set(
      error instanceof Error ? error.message : "This tab cannot use Dark Mode Lite.",
      true,
    );
  }
}

async function saveSettings(patch: { enabled?: boolean; strength?: number }): Promise<void> {
  const tabId = await getActiveTabId();

  if (!tabId) {
    statusView.set("No active tab available.", true);
    return;
  }

  const response = await sendMessage(tabId, {
    type: "DARK_MODE_SET_SITE_STATE",
    payload: patch,
  });

  if (!response.ok) {
    statusView.set(response.error.message, true);
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
