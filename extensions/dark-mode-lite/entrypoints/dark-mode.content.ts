import { onContractMessage } from "@hub/shared/messaging";
import { createNamespacedStorage } from "@hub/shared/storage";
import { darkModeMessages } from "../lib/messages";
import { getSiteState, patchSiteState } from "../lib/settings";
import { darkModeDefaults, validateDarkModeSettings } from "../lib/types";

const settingsStorage = createNamespacedStorage(
  "dark-mode-lite.settings",
  darkModeDefaults,
  "local",
  {
    validate: validateDarkModeSettings,
  },
);

const styleId = "__hub_dark_mode_lite_style__";

function applyDarkMode(enabled: boolean, strength: number): void {
  const existingStyle = document.getElementById(styleId);

  if (!enabled) {
    existingStyle?.remove();
    return;
  }

  let style = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.append(style);
  }

  const strengthRatio = Math.min(100, Math.max(0, strength)) / 100;
  const brightness = 1 + 0.06 * strengthRatio;
  const contrast = 1 + 0.08 * strengthRatio;
  const mediaFilter = "invert(1) hue-rotate(180deg)";

  style.textContent = `
    :root {
      --hub-dark-mode-strength: ${strengthRatio};
    }

    html {
      filter: invert(1) hue-rotate(180deg) brightness(${brightness}) contrast(${contrast}) !important;
      background-color: #111827 !important;
    }

    img,
    picture,
    video,
    canvas,
    svg,
    iframe {
      filter: ${mediaFilter} !important;
    }
  `;
}

export default defineContentScript({
  matches: [],
  registration: "runtime",
  runAt: "document_idle",
  allFrames: false,
  main() {
    const origin = document.location.origin;

    // Register the handler before any asynchronous storage work so the popup can
    // safely message this runtime-injected content script immediately.
    let siteState = getSiteState(darkModeDefaults, origin);

    onContractMessage(darkModeMessages, {
      DARK_MODE_GET_SITE_STATE: () => siteState,
      DARK_MODE_SET_SITE_STATE: async (payload) => {
        const nextSettings = patchSiteState(await settingsStorage.get(), origin, payload);
        await settingsStorage.patch(nextSettings);
        siteState = getSiteState(nextSettings, origin);
        return siteState;
      },
    });

    void settingsStorage.get().then((nextSettings) => {
      siteState = getSiteState(nextSettings, origin);
      applyDarkMode(siteState.settings.enabled, siteState.settings.strength);
    });

    settingsStorage.subscribe((nextSettings) => {
      siteState = getSiteState(nextSettings, origin);
      applyDarkMode(siteState.settings.enabled, siteState.settings.strength);
    });
  },
});
