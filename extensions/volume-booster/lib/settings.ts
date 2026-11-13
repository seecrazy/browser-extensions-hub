import type { VolumeSettings } from "./types";

export function getSiteLevel(settings: VolumeSettings, origin: string): number {
  return settings.sites[origin]?.level ?? settings.defaultLevel;
}

export function patchSiteLevel(
  settings: VolumeSettings,
  origin: string,
  level: number,
): VolumeSettings {
  return {
    ...settings,
    sites: {
      ...settings.sites,
      [origin]: {
        level,
      },
    },
  };
}
