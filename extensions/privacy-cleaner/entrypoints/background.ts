import { onContractMessage } from "@hub/shared/messaging";
import { privacyMessages } from "../lib/messages";
import { createNamespacedStorage } from "@hub/shared/storage";
import {
  activeCleanupTypes,
  normalizeOrigin,
  privacyDefaults,
  validatePrivacySettings,
} from "../lib/types";
import type { PrivacyCleanupResult } from "../lib/types";

const settingsStorage = createNamespacedStorage(
  "privacy-cleaner.settings",
  privacyDefaults,
  "local",
  {
    validate: validatePrivacySettings,
  },
);

async function cleanCurrentTab(): Promise<PrivacyCleanupResult> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const origin = normalizeOrigin(tab?.url);
  const settings = await settingsStorage.get();
  const dataToRemove = activeCleanupTypes(settings.cleanup);

  if (Object.keys(dataToRemove).length === 0) {
    throw new Error("Select at least one data type in settings.");
  }

  await chrome.browsingData.remove(
    {
      origins: [origin],
    },
    dataToRemove,
  );

  return {
    origin,
    cleanup: settings.cleanup,
  };
}

export default defineBackground(() => {
  onContractMessage(privacyMessages, {
    PRIVACY_CLEAN_CURRENT_TAB: () => cleanCurrentTab(),
    PRIVACY_GET_SETTINGS: () => settingsStorage.get(),
    PRIVACY_SET_SETTINGS: async (payload) => settingsStorage.patch({ cleanup: payload }),
  });
});
