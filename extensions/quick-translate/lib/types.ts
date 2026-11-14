export type TranslateProviderId = "google";

export type TranslateSettings = {
  schemaVersion: 1;
  provider: TranslateProviderId;
  targetLanguage: string;
  timeoutMs: number;
  enabledOrigins: string[];
  enabledAllSites: boolean;
  disabledOrigins: string[];
};

export type TranslationResult = {
  text: string;
  sourceLanguage?: string;
};

export const translateDefaults: TranslateSettings = {
  schemaVersion: 1,
  provider: "google",
  targetLanguage: "en",
  timeoutMs: 6000,
  enabledOrigins: [],
  enabledAllSites: false,
  disabledOrigins: [],
};

export const RTL_LANGUAGES = new Set(["ar", "he", "fa", "ur", "ps", "sd", "ug", "yi"]);

export function isRtlLanguage(language: string | undefined): boolean {
  if (!language) {
    return false;
  }

  return RTL_LANGUAGES.has(language.toLowerCase().split("-")[0] ?? "");
}

export function validateTranslateSettings(value: unknown): TranslateSettings {
  const record =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return {
    schemaVersion: 1,
    provider: record.provider === "google" ? "google" : "google",
    targetLanguage: typeof record.targetLanguage === "string" ? record.targetLanguage : "en",
    timeoutMs:
      typeof record.timeoutMs === "number" && record.timeoutMs >= 1000 && record.timeoutMs <= 20_000
        ? record.timeoutMs
        : 6000,
    enabledOrigins: Array.isArray(record.enabledOrigins)
      ? [
          ...new Set(
            record.enabledOrigins.filter((origin): origin is string => typeof origin === "string"),
          ),
        ]
      : [],
    enabledAllSites: record.enabledAllSites === true,
    disabledOrigins: Array.isArray(record.disabledOrigins)
      ? [
          ...new Set(
            record.disabledOrigins.filter((origin): origin is string => typeof origin === "string"),
          ),
        ]
      : [],
  };
}
