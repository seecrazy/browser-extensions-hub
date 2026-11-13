import { createMessageSender } from "@hub/shared/messaging";
import { createStatusView } from "@hub/shared/ui";
import { browser } from "wxt/browser";
import "@hub/shared/ui/styles.css";
import { privacyMessages } from "../../lib/messages";
import { normalizeOrigin } from "../../lib/types";
import type { PrivacySettings } from "../../lib/types";

const originLabel = document.querySelector<HTMLParagraphElement>("#origin");
const cleanButton = document.querySelector<HTMLButtonElement>("#clean");
const optionsButton = document.querySelector<HTMLButtonElement>("#options");
const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));
const sendMessage = createMessageSender(privacyMessages);

function formatTypes(settings: PrivacySettings): string {
  const selected = Object.entries(settings.cleanup)
    .filter(([, enabled]) => enabled)
    .map(([type]) => type)
    .join(", ");
  return selected || "no data types";
}

async function loadOrigin(): Promise<void> {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (originLabel) {
    try {
      originLabel.textContent = tab?.url ? new URL(tab.url).origin : "Unknown origin";
    } catch {
      originLabel.textContent = "Unsupported page";
    }
  }
}

cleanButton?.addEventListener("click", async () => {
  if (!cleanButton) {
    return;
  }

  cleanButton.disabled = true;
  statusView.set("Cleaning...");
  const response = await sendMessage({
    type: "PRIVACY_CLEAN_CURRENT_TAB",
  });

  if (!response.ok) {
    statusView.set(response.error.message, true);
    cleanButton.disabled = false;
    return;
  }

  const selectedTypes = formatTypes({ schemaVersion: 1, cleanup: response.data.cleanup });
  statusView.set(`Cleared ${selectedTypes} for ${normalizeOrigin(response.data.origin)}.`);
});

optionsButton?.addEventListener("click", () => {
  void browser.runtime.openOptionsPage();
});

void loadOrigin();
