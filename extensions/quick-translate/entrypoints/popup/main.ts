import { createNamespacedStorage } from "@hub/shared/storage";
import { injectRuntimeContentScript } from "@hub/shared/injection";
import { createStatusView } from "@hub/shared/ui";
import "@hub/shared/ui/styles.css";
import { translateDefaults } from "../../lib/types";

type TranslateSettings = typeof translateDefaults;
const settingsStorage = createNamespacedStorage("quick-translate.settings", translateDefaults);
const languageSelect = document.querySelector<HTMLSelectElement>("#language");
const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));

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
  statusView.set("Saved.");
});

document.querySelector<HTMLButtonElement>("#activate")?.addEventListener("click", async () => {
  try {
    await injectRuntimeContentScript({
      file: "/content-scripts/quick-translate.js",
    });
    statusView.set("Activated. Select text to translate.");
  } catch (error) {
    statusView.set(
      error instanceof Error ? error.message : "This tab cannot use Quick Translate.",
      true,
    );
  }
});

void loadSettings();
