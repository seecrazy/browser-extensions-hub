import type {
  ReadingProgressSettings,
  ReadingProgressSiteSettings,
  ReadingProgressSiteState,
} from "./types";

export function getSiteState(
  settings: ReadingProgressSettings,
  origin: string,
): ReadingProgressSiteState {
  return {
    origin,
    settings: settings.sites[origin] ?? {
      enabled: true,
      color: "#60a5fa",
      height: 3,
      position: "top",
      offsetTop: 0,
      offsetBottom: 0,
    },
  };
}

export function patchSiteState(
  settings: ReadingProgressSettings,
  origin: string,
  patch: Partial<Omit<ReadingProgressSiteSettings, never>>,
): ReadingProgressSettings {
  const current = getSiteState(settings, origin).settings;

  return {
    ...settings,
    sites: {
      ...settings.sites,
      [origin]: {
        enabled: patch.enabled ?? current.enabled,
        color: patch.color ?? current.color,
        height: patch.height ?? current.height,
        position: patch.position ?? current.position,
        offsetTop: patch.offsetTop ?? current.offsetTop,
        offsetBottom: patch.offsetBottom ?? current.offsetBottom,
      },
    },
  };
}

export function getScrollRatio(document: Document, window: Window): number {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop || window.scrollY;
  const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
  const clientHeight = document.documentElement.clientHeight || window.innerHeight;
  const maxScroll = Math.max(1, scrollHeight - clientHeight);

  return Math.min(1, Math.max(0, scrollTop / maxScroll));
}
