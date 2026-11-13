export type ReadingProgressSiteSettings = {
  enabled: boolean;
  color: string;
  height: number;
  position: "top" | "bottom";
  offsetTop: number;
  offsetBottom: number;
};

export type ReadingProgressSettings = {
  schemaVersion: 1;
  sites: Record<string, ReadingProgressSiteSettings>;
};

export type ReadingProgressSiteState = {
  origin: string;
  settings: ReadingProgressSiteSettings;
};

export const readingProgressDefaults: ReadingProgressSettings = {
  schemaVersion: 1,
  sites: {},
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function normalizeColor(value: unknown): string {
  if (typeof value === "string" && HEX_COLOR.test(value)) {
    return value.toLowerCase();
  }

  return "#60a5fa";
}

export function normalizeHeight(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 3;
  }

  return Math.min(12, Math.max(2, Math.round(value)));
}

export function normalizeOffset(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.min(200, Math.max(0, Math.round(value)));
}

export function normalizePosition(value: unknown): "top" | "bottom" {
  return value === "bottom" ? "bottom" : "top";
}

export function validateReadingProgressSettings(value: unknown): ReadingProgressSettings {
  const record =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const sitesRecord =
    typeof record.sites === "object" && record.sites !== null
      ? (record.sites as Record<string, unknown>)
      : {};
  const sites: Record<string, ReadingProgressSiteSettings> = {};

  for (const [origin, site] of Object.entries(sitesRecord)) {
    const siteRecord =
      typeof site === "object" && site !== null ? (site as Record<string, unknown>) : {};
    sites[origin] = {
      enabled: siteRecord.enabled === true,
      color: normalizeColor(siteRecord.color),
      height: normalizeHeight(siteRecord.height),
      position: normalizePosition(siteRecord.position),
      offsetTop: normalizeOffset(siteRecord.offsetTop),
      offsetBottom: normalizeOffset(siteRecord.offsetBottom),
    };
  }

  return {
    schemaVersion: 1,
    sites,
  };
}
