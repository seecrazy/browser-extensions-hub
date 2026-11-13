export type VolumeMediaState = {
  level: number;
  mediaCount: number;
  unsupportedCount: number;
  audioContextState: "none" | AudioContextState;
};

export type VolumeSettings = {
  schemaVersion: 1;
  defaultLevel: number;
  sites: Record<string, { level: number }>;
};

export const volumeDefaults: VolumeSettings = {
  schemaVersion: 1,
  defaultLevel: 100,
  sites: {},
};

export function normalizeLevel(level: unknown): number {
  if (typeof level !== "number" || Number.isNaN(level)) {
    return 100;
  }

  return Math.min(300, Math.max(0, Math.round(level)));
}

export function validateVolumeSettings(value: unknown): VolumeSettings {
  const record =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const sites: Record<string, { level: number }> = {};

  if (typeof record.sites === "object" && record.sites !== null) {
    for (const [origin, site] of Object.entries(record.sites)) {
      const siteRecord =
        typeof site === "object" && site !== null ? (site as Record<string, unknown>) : {};
      sites[origin] = {
        level: normalizeLevel(siteRecord.level),
      };
    }
  }

  return {
    schemaVersion: 1,
    defaultLevel: normalizeLevel(record.defaultLevel),
    sites,
  };
}
