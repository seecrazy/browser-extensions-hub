export type PrivacyCleanupTypes = {
  cookies: boolean;
  localStorage: boolean;
  indexedDb: boolean;
  cache: boolean;
};

export type PrivacySettings = {
  schemaVersion: 1;
  cleanup: PrivacyCleanupTypes;
};

export type PrivacyCleanupResult = {
  origin: string;
  cleanup: PrivacyCleanupTypes;
};

export const privacyDefaults: PrivacySettings = {
  schemaVersion: 1,
  cleanup: {
    cookies: true,
    localStorage: true,
    indexedDb: true,
    cache: false,
  },
};

export function activeCleanupTypes(
  value: PrivacyCleanupTypes,
): Partial<Record<"cookies" | "localStorage" | "indexedDB" | "cache", boolean>> {
  const result: Partial<Record<"cookies" | "localStorage" | "indexedDB" | "cache", boolean>> = {};
  if (value.cookies) result.cookies = true;
  if (value.localStorage) result.localStorage = true;
  if (value.indexedDb) result.indexedDB = true;
  if (value.cache) result.cache = true;
  return result;
}

export function normalizeOrigin(input: string | undefined): string {
  if (!input) {
    throw new Error("Unable to determine the active tab origin.");
  }

  try {
    const url = new URL(input);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Only http and https origins can be cleaned.");
    }

    return url.origin;
  } catch {
    throw new Error("Unable to determine the active tab origin.");
  }
}

export function validatePrivacySettings(value: unknown): PrivacySettings {
  const record =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const cleanupRecord =
    typeof record.cleanup === "object" && record.cleanup !== null
      ? (record.cleanup as Record<string, unknown>)
      : {};

  return {
    schemaVersion: 1,
    cleanup: {
      cookies: cleanupRecord.cookies === true,
      localStorage: cleanupRecord.localStorage === true,
      indexedDb: cleanupRecord.indexedDb === true,
      cache: cleanupRecord.cache === true,
    },
  };
}
