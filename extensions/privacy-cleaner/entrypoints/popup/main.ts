import { browser } from "wxt/browser";
import "@hub/shared/ui/styles.css";
import { createMessageSender } from "@hub/shared/messaging";
import { privacyMessages } from "../../lib/messages";

const originLabel = document.querySelector<HTMLParagraphElement>("#origin");
const cleanButton = document.querySelector<HTMLButtonElement>("#clean");
const optionsButton = document.querySelector<HTMLButtonElement>("#options");
const status = document.querySelector<HTMLParagraphElement>("#status");
const sendMessage = createMessageSender(privacyMessages);

function setStatus(message: string, isError = false): void {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("hub-status-error", isError);
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
  if (!cleanButton || !status) {
    return;
  }

  cleanButton.disabled = true;
  setStatus("Cleaning...");
  const response = await sendMessage({
    type: "PRIVACY_CLEAN_CURRENT_TAB",
  });

  if (!response.ok) {
    setStatus(response.error.message, true);
    cleanButton.disabled = false;
    return;
  }

  setStatus(`Removed selected storage data for ${response.data.origin}.`);
});

optionsButton?.addEventListener("click", () => {
  void browser.runtime.openOptionsPage();
});

void loadOrigin();
