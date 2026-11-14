import { onContractMessage } from "@hub/shared/messaging";
import { quickTranslateMessages } from "../lib/messages";
import { translate, truncateTranslationText } from "../lib/translate";

export default defineBackground(() => {
  onContractMessage(quickTranslateMessages, {
    QUICK_TRANSLATE_TRANSLATE: async (payload) => {
      return translate({
        text: truncateTranslationText(payload.text),
        targetLanguage: payload.targetLanguage,
      });
    },
    QUICK_TRANSLATE_PING: () => {
      return {
        active: true,
      };
    },
  });
});
