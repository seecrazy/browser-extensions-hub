import { sendTabMessage } from "@hub/shared/messaging";
import "@hub/shared/ui/styles.css";
import { browser } from "wxt/browser";

type DarkModeSettings = {
  schemaVersion: number;
  enabled: boolean;
  strength: number;
};

const enabledInput = document.querySelector<HTMLInputElement>("#enabled");
const strengthInput = document.querySelector<HTMLInputElement>("#strength");
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
    files: ["/content-scripts/dark-mode.js"],
  });
}

async function loadSettings(): Promise<void> {
  const tabId = await getActiveTabId();

  if (!tabId || !enabledInput || !strengthInput) {
    setStatus("No active tab available.", true);
    return;
  }

  try {
    await injectContentScript(tabId);
    const response = await sendTabMessage<"DARK_MODE_GET_STATE", DarkModeSettings>(tabId, {
      type: "DARK_MODE_GET_STATE",
    });

    if (!response.ok) {
      setStatus(response.error.message, true);
      return;
    }

    enabledInput.checked = response.data.enabled;
    strengthInput.value = String(response.data.strength);
    setStatus("Connected to current tab.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "This tab cannot use Dark Mode Lite.", true);
  }
}

async function saveSettings(
  patch: Partial<Omit<DarkModeSettings, "schemaVersion">>,
): Promise<void> {
  const tabId = await getActiveTabId();

  if (!tabId) {
    setStatus("No active tab available.", true);
    return;
  }

  const response = await sendTabMessage<"DARK_MODE_SET_STATE", DarkModeSettings>(tabId, {
    type: "DARK_MODE_SET_STATE",
    payload: patch,
  });

  if (!response.ok) {
    setStatus(response.error.message, true);
  }
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
