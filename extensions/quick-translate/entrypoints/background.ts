import { browser } from "wxt/browser";

import { onContractMessage } from "@hub/shared/messaging";
import { createNamespacedStorage } from "@hub/shared/storage";
import { quickTranslateMessages } from "../lib/messages";
import { syncRegisteredSiteScripts } from "../lib/site-access";
import { translateText, truncateTranslationText } from "../lib/translate";
import { translateDefaults, validateTranslateSettings } from "../lib/types";

const settingsStorage = createNamespacedStorage(
  "quick-translate.settings",
  translateDefaults,
  "local",
  {
    validate: validateTranslateSettings,
  },
);

async function syncSiteAccess(): Promise<void> {
  const settings = await settingsStorage.get();
  const { settings: nextSettings, changed } = await syncRegisteredSiteScripts(settings);

  if (changed) {
    await settingsStorage.patch(nextSettings);
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    void syncSiteAccess();
  });
  browser.runtime.onStartup.addListener(() => {
    void syncSiteAccess();
  });

  onContractMessage(quickTranslateMessages, {
    QUICK_TRANSLATE_TRANSLATE: async (payload) => {
      const settings = await settingsStorage.get();
      return translateText({
        text: truncateTranslationText(payload.text),
        targetLanguage: payload.targetLanguage || settings.targetLanguage,
        provider: settings.provider,
        timeoutMs: settings.timeoutMs,
      });
    },
  });
});
