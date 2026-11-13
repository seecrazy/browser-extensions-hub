export type DarkModeSiteSettings = {
  enabled: boolean;
  strength: number;
};

export type DarkModeSettings = {
  schemaVersion: 1;
  sites: Record<string, DarkModeSiteSettings>;
};

export type DarkModeSiteState = {
  origin: string;
  settings: DarkModeSiteSettings;
};

export const darkModeDefaults: DarkModeSettings = {
  schemaVersion: 1,
  sites: {},
};

export function normalizeStrength(strength: unknown): number {
  if (typeof strength !== "number" || Number.isNaN(strength)) {
    return 70;
  }

  return Math.min(100, Math.max(0, Math.round(strength)));
}

export function normalizeSiteSettings(value: unknown): DarkModeSiteSettings {
  const record =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return {
    enabled: record.enabled === true,
    strength: normalizeStrength(record.strength),
  };
}

export function validateDarkModeSettings(value: unknown): DarkModeSettings {
  const record =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const sites: Record<string, DarkModeSiteSettings> = {};

  if (typeof record.sites === "object" && record.sites !== null) {
    for (const [origin, site] of Object.entries(record.sites)) {
      sites[origin] = normalizeSiteSettings(site);
    }
  }

  return {
    schemaVersion: 1,
    sites,
  };
}
