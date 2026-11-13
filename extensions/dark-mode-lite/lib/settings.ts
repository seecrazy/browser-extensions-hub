import type { DarkModeSettings, DarkModeSiteSettings, DarkModeSiteState } from "./types";

export function getSiteState(settings: DarkModeSettings, origin: string): DarkModeSiteState {
  return {
    origin,
    settings: settings.sites[origin] ?? {
      enabled: false,
      strength: 70,
    },
  };
}

export function patchSiteState(
  settings: DarkModeSettings,
  origin: string,
  patch: Partial<Omit<DarkModeSiteSettings, never>>,
): DarkModeSettings {
  const current = getSiteState(settings, origin).settings;

  return {
    ...settings,
    sites: {
      ...settings.sites,
      [origin]: {
        enabled: patch.enabled ?? current.enabled,
        strength: patch.strength ?? current.strength,
      },
    },
  };
}
