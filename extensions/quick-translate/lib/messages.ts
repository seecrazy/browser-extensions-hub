import { defineMessageContract } from "@hub/shared/messaging";

export type TranslationResult = {
  text: string;
};

export const quickTranslateMessages = defineMessageContract({
  QUICK_TRANSLATE_TRANSLATE: {
    payload: {} as {
      text: string;
      targetLanguage: string;
    },
    response: {} as TranslationResult,
  },
  QUICK_TRANSLATE_PING: {
    payload: undefined,
    response: {} as {
      active: boolean;
    },
  },
});
