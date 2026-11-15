export type FontKey = "" | "kaiti" | "xingkai" | "songti" | "heiti" | "fangti";

export type FontSiteSettings = {
  enabled: boolean;
  fontKey: FontKey;
};

export type FontSwitcherSettings = {
  schemaVersion: 1;
  defaultFont: FontKey;
  sites: Record<string, FontSiteSettings>;
};

export type FontSwitcherSiteState = {
  origin: string;
  settings: FontSiteSettings;
  defaultFont: FontKey;
};

export type FontSwitcherPatch = {
  fontKey?: FontKey;
};

export const fontKeys = ["", "kaiti", "xingkai", "songti", "heiti", "fangti"] as const;

export const fontSwitcherDefaults: FontSwitcherSettings = {
  schemaVersion: 1,
  defaultFont: "kaiti",
  sites: {},
};

export function normalizeFontKey(value: unknown): FontKey {
  return fontKeys.includes(value as FontKey) ? (value as FontKey) : "";
}

export function normalizeSiteSettings(value: unknown): FontSiteSettings {
  const record =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return {
    enabled: record.enabled === true,
    fontKey: normalizeFontKey(record.fontKey),
  };
}

export function validateFontSwitcherSettings(value: unknown): FontSwitcherSettings {
  const record =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const sites: Record<string, FontSiteSettings> = {};

  if (typeof record.sites === "object" && record.sites !== null) {
    for (const [origin, site] of Object.entries(record.sites)) {
      sites[origin] = normalizeSiteSettings(site);
    }
  }

  return {
    schemaVersion: 1,
    defaultFont: normalizeFontKey(record.defaultFont) || "kaiti",
    sites,
  };
}
