export type TranslationResult = {
  text: string;
};

export type TranslateInput = {
  text: string;
  targetLanguage: string;
  timeoutMs?: number;
};

export type TranslateDependencies = {
  fetch?: typeof fetch;
};

export const TRANSLATION_ENDPOINTS = [
  "https://translate.googleapis.com/translate_a/single",
  "https://clients5.google.com/translate_a/single",
] as const;

const DEFAULT_TIMEOUT_MS = 8000;

export function truncateTranslationText(text: string, maxLength = 1000): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function parseTranslationResponse(data: unknown): TranslationResult {
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Translation service returned an unexpected response.");
  }

  const translatedText = (data[0] as unknown[])
    .map((segment) => (Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : ""))
    .join("");

  if (!translatedText) {
    throw new Error("Translation service returned empty text.");
  }

  const sourceLanguage =
    typeof (data as Array<unknown>)[2] === "string" ? (data as Array<unknown>)[2] : undefined;

  return {
    text: translatedText,
    ...(typeof sourceLanguage === "string" ? { sourceLanguage } : {}),
  } satisfies TranslationResult;
}

function buildTranslateUrl(endpoint: string, input: TranslateInput): URL {
  const url = new URL(endpoint);
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", input.targetLanguage);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", input.text);
  return url;
}

async function fetchWithTimeout(
  url: URL,
  timeoutMs: number,
  fetchImpl: typeof fetch,
): Promise<Response> {
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Translation request timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  return Promise.race([
    fetchImpl(url, {
      headers: {
        Accept: "application/json",
      },
    }),
    timeoutPromise,
  ]);
}

export async function translate(
  input: TranslateInput,
  dependencies: TranslateDependencies = {},
): Promise<TranslationResult> {
  const fetchImpl = dependencies.fetch ?? fetch;
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError: unknown;

  for (const endpoint of TRANSLATION_ENDPOINTS) {
    try {
      const response = await fetchWithTimeout(
        buildTranslateUrl(endpoint, input),
        timeoutMs,
        fetchImpl,
      );

      if (!response.ok) {
        throw new Error(`Translation service returned ${response.status}.`);
      }

      return parseTranslationResponse(await response.json());
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Translation request failed.");
}
