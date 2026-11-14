import { onContractMessage } from "@hub/shared/messaging";
import { quickTranslateMessages } from "../lib/messages";

type TranslationResult = {
  text: string;
};

async function translate(text: string, targetLanguage: string): Promise<TranslationResult> {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", targetLanguage);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Translation service returned ${response.status}.`);
  }

  const data = (await response.json()) as unknown;

  if (
    !Array.isArray(data) ||
    !Array.isArray(data[0]) ||
    data[0].some((part) => !Array.isArray(part))
  ) {
    throw new Error("Translation service returned an unexpected response.");
  }

  const translatedText = (data[0] as unknown[][])
    .map((part) => (typeof part[0] === "string" ? part[0] : ""))
    .join("");
  return {
    text: translatedText,
  };
}

export default defineBackground(() => {
  onContractMessage(quickTranslateMessages, {
    QUICK_TRANSLATE_TRANSLATE: async (payload) => {
      return translate(payload.text, payload.targetLanguage);
    },
    QUICK_TRANSLATE_PING: () => {
      return {
        active: true,
      };
    },
  });
});
