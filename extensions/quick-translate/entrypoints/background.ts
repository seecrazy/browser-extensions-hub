import { browser } from "wxt/browser";

import { onContractMessage } from "@hub/shared/messaging";
import { createNamespacedStorage } from "@hub/shared/storage";
import { quickTranslateMessages } from "../lib/messages";
import {
  isAllSitesPermissionGranted,
  isSitePermissionGranted,
  registerAllSitesContentScript,
  registerSiteContentScript,
  setSiteEnabled,
  unregisterAllSitesContentScript,
  unregisterSiteContentScript,
} from "../lib/site-access";
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
  let nextSettings = settings;
  let changed = false;

  for (const origin of settings.enabledOrigins) {
    const granted = await isSitePermissionGranted(origin);

    if (!granted) {
      await unregisterSiteContentScript(origin);
      nextSettings = setSiteEnabled(nextSettings, origin, false);
      changed = true;
      continue;
    }

    await registerSiteContentScript(origin);
  }

  const allGranted = await isAllSitesPermissionGranted();

  if (nextSettings.enabledAllSites && !allGranted) {
    await unregisterAllSitesContentScript();
    nextSettings = {
      ...nextSettings,
      enabledAllSites: false,
    };
    changed = true;
  } else if (nextSettings.enabledAllSites && allGranted) {
    await registerAllSitesContentScript();
  }

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
