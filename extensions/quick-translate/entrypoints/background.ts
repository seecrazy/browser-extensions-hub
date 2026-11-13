import { onContractMessage } from "@hub/shared/messaging";
import { createNamespacedStorage } from "@hub/shared/storage";
import { quickTranslateMessages } from "../lib/messages";
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

export default defineBackground(() => {
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
