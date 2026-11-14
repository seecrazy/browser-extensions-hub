import { defineMessageContract } from "@hub/shared/messaging";
import type { TranslationResult } from "./types";

export const quickTranslateMessages = defineMessageContract({
  QUICK_TRANSLATE_ENABLE_TEMPORARY: {
    payload: undefined,
    response: {} as {
      active: boolean;
    },
  },
  QUICK_TRANSLATE_TRANSLATE: {
    payload: {} as {
      text: string;
      targetLanguage: string;
    },
    response: {} as TranslationResult,
  },
});
