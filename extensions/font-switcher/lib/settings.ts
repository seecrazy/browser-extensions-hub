import type {
  FontKey,
  FontSiteSettings,
  FontSwitcherPatch,
  FontSwitcherSettings,
  FontSwitcherSiteState,
} from "./types";

export function getSiteState(
  settings: FontSwitcherSettings,
  origin: string,
): FontSwitcherSiteState {
  const settingsForSite = settings.sites[origin] ?? {
    enabled: false,
    fontKey: settings.defaultFont,
  };

  return {
    origin,
    settings: settingsForSite,
    defaultFont: settings.defaultFont,
  };
}

export function patchSiteState(
  settings: FontSwitcherSettings,
  origin: string,
  patch: FontSwitcherPatch,
): FontSwitcherSettings {
  const requested: FontKey = patch.fontKey ?? "";
  const next: FontSiteSettings = {
    enabled: requested !== "",
    fontKey: requested === "" ? settings.defaultFont : requested,
  };

  return {
    ...settings,
    sites: {
      ...settings.sites,
      [origin]: next,
    },
  };
}

export function patchDefaultFont(
  settings: FontSwitcherSettings,
  fontKey: FontKey,
): FontSwitcherSettings {
  return {
    ...settings,
    defaultFont: fontKey === "" ? "kaiti" : fontKey,
  };
}
