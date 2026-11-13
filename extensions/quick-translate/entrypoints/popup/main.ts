import { createNamespacedStorage } from "@hub/shared/storage";
import { browser } from "wxt/browser";
import "@hub/shared/ui/styles.css";
import { translateDefaults } from "../../lib/types";

type TranslateSettings = typeof translateDefaults;
const settingsStorage = createNamespacedStorage("quick-translate.settings", translateDefaults);
const languageSelect = document.querySelector<HTMLSelectElement>("#language");
const status = document.querySelector<HTMLParagraphElement>("#status");

function setStatus(message: string, isError = false): void {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("hub-status-error", isError);
}

async function loadSettings(): Promise<void> {
  const settings = (await settingsStorage.get()) as TranslateSettings;

  if (languageSelect) {
    languageSelect.value = settings.targetLanguage;
  }
}

languageSelect?.addEventListener("change", async () => {
  await settingsStorage.patch({
    targetLanguage: languageSelect.value,
  });
  setStatus("Saved.");
});

document.querySelector<HTMLButtonElement>("#activate")?.addEventListener("click", async () => {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab?.id) {
    setStatus("No active tab available.", true);
    return;
  }

  try {
    await browser.scripting.executeScript({
      target: {
        tabId: tab.id,
      },
      files: ["/content-scripts/quick-translate.js"],
    });
    setStatus("Activated. Select text to translate.");
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "This tab cannot use Quick Translate.",
      true,
    );
  }
});

void loadSettings();
