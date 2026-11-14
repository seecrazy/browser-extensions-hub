import { getActiveTab, getInjectionErrorMessage, isInjectableUrl } from "@hub/shared/injection";
import { createNamespacedStorage } from "@hub/shared/storage";
import "@hub/shared/ui/styles.css";
import { browser } from "wxt/browser";

type TranslateSettings = {
  schemaVersion: number;
  targetLanguage: string;
};

const settingsStorage = createNamespacedStorage<TranslateSettings>("quick-translate.settings", {
  schemaVersion: 1,
  targetLanguage: "en",
});
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
  const settings = await settingsStorage.get();

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
  const { tabId, url } = await getActiveTab();

  if (!tabId) {
    setStatus("No active tab available.", true);
    return;
  }

  if (!isInjectableUrl(url)) {
    setStatus(
      "This page type cannot be translated. Open an http or https website, then activate.",
      true,
    );
    return;
  }

  try {
    await browser.scripting.executeScript({
      target: {
        tabId,
      },
      files: ["/content-scripts/quick-translate.js"],
    });
    setStatus("Activated. Select text to translate.");
  } catch (error) {
    setStatus(getInjectionErrorMessage(error, url), true);
  }
});

void loadSettings();
