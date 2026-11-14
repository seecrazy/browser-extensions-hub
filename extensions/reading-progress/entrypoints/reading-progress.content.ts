import { onContractMessage } from "@hub/shared/messaging";
import { createNamespacedStorage } from "@hub/shared/storage";
import { readingProgressMessages } from "../lib/messages";
import { getScrollRatio, getSiteState, patchSiteState } from "../lib/settings";
import { readingProgressDefaults, validateReadingProgressSettings } from "../lib/types";
import type { ReadingProgressSiteSettings } from "../lib/types";

const settingsStorage = createNamespacedStorage(
  "reading-progress.settings",
  readingProgressDefaults,
  "local",
  {
    validate: validateReadingProgressSettings,
  },
);

const barId = "__hub_reading_progress_bar__";
let frame: number | undefined;

function renderBar(settings: ReadingProgressSiteSettings): void {
  let bar = document.getElementById(barId) as HTMLDivElement | null;

  if (!settings.enabled) {
    bar?.remove();
    return;
  }

  if (!bar) {
    bar = document.createElement("div");
    bar.id = barId;
    bar.setAttribute("aria-hidden", "true");
    document.body.append(bar);
  }

  const ratio = getScrollRatio(document, window);
  bar.style.position = "fixed";
  bar.style.left = "0";
  bar.style.right = "0";
  bar.style.height = `${settings.height}px`;
  bar.style.width = `${Math.round(ratio * 100)}%`;
  bar.style.background = settings.color;
  bar.style.zIndex = "2147483647";
  bar.style.transition = "width 60ms linear";

  if (settings.position === "top") {
    bar.style.top = `${settings.offsetTop}px`;
    bar.style.bottom = "";
  } else {
    bar.style.top = "";
    bar.style.bottom = `${settings.offsetBottom}px`;
  }
}

function scheduleRender(settings: ReadingProgressSiteSettings): void {
  if (frame !== undefined) {
    return;
  }

  frame = window.requestAnimationFrame(() => {
    frame = undefined;
    renderBar(settings);
  });
}

export default defineContentScript({
  matches: [],
  registration: "runtime",
  runAt: "document_idle",
  allFrames: false,
  main() {
    const installedMarker = "__hubReadingProgressInstalled";
    const windowWithMarker = window as typeof window & Record<string, boolean | undefined>;

    if (windowWithMarker[installedMarker]) {
      return;
    }

    windowWithMarker[installedMarker] = true;
    const origin = document.location.origin;

    // Message handling must be registered synchronously because the popup sends
    // a state request immediately after runtime injection.
    let siteState = getSiteState(readingProgressDefaults, origin);

    onContractMessage(readingProgressMessages, {
      READING_PROGRESS_GET_SITE_STATE: () => siteState,
      READING_PROGRESS_SET_SITE_STATE: async (payload) => {
        const nextSettings = patchSiteState(await settingsStorage.get(), origin, payload);
        await settingsStorage.patch(nextSettings);
        siteState = getSiteState(nextSettings, origin);
        renderBar(siteState.settings);
        return siteState;
      },
    });

    void settingsStorage.get().then((nextSettings) => {
      siteState = getSiteState(nextSettings, origin);
      renderBar(siteState.settings);
    });

    const listener = (): void => {
      scheduleRender(siteState.settings);
    };
    window.addEventListener("scroll", listener, {
      passive: true,
    });
    window.addEventListener("resize", listener, {
      passive: true,
    });

    settingsStorage.subscribe((nextSettings) => {
      siteState = getSiteState(nextSettings, origin);
      renderBar(siteState.settings);
    });
  },
});
