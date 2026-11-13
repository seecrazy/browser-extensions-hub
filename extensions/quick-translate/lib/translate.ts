import type { TranslateProviderId, TranslationResult } from "./types";

export type TranslateInput = {
  text: string;
  targetLanguage: string;
  provider?: TranslateProviderId;
  timeoutMs?: number;
};

export type TranslateDependencies = {
  fetch?: typeof fetch;
  now?: () => number;
};

export function truncateTranslationText(text: string, maxLength = 1000): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function parseGoogleTranslateResponse(data: unknown): TranslationResult {
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Translation service returned an unexpected response.");
  }

  const segments = data[0] as unknown[];
  const translatedText = segments
    .map((segment) => (Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : ""))
    .join("");

  if (!translatedText) {
    throw new Error("Translation service returned empty text.");
  }

  return {
    text: translatedText,
    ...(typeof data[2] === "string" ? { sourceLanguage: data[2] } : {}),
  };
}

export async function translateText(
  input: TranslateInput,
  dependencies: TranslateDependencies = {},
): Promise<TranslationResult> {
  const provider = input.provider ?? "google";

  if (provider !== "google") {
    throw new Error(`Unsupported translation provider: ${provider}`);
  }

  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", input.targetLanguage);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", input.text);

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), input.timeoutMs ?? 6000);

  try {
    const response = await (dependencies.fetch ?? fetch)(url, {
      headers: {
        Accept: "application/json",
      },
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Translation service returned ${response.status}.`);
    }

    return parseGoogleTranslateResponse(await response.json());
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Translation request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
