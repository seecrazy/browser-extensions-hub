import { onContractMessage } from "@hub/shared/messaging";
import { createNamespacedStorage } from "@hub/shared/storage";
import { fontClassMap, fontFaceCss } from "../lib/fonts";
import { getSiteState, patchDefaultFont, patchSiteState } from "../lib/settings";
import { fontSwitcherDefaults, validateFontSwitcherSettings } from "../lib/types";
import { fontSwitcherMessages } from "../lib/messages";
import type { FontKey } from "../lib/types";

const settingsStorage = createNamespacedStorage(
  "font-switcher.settings",
  fontSwitcherDefaults,
  "local",
  {
    validate: validateFontSwitcherSettings,
  },
);

const styleId = "__hub_font_switcher_styles__";

function ensureStyles(): void {
  let style = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.append(style);
    style.textContent = fontFaceCss;
  }
}

function applyState(settings: { enabled: boolean; fontKey: FontKey }): void {
  document.body.classList.remove(...Object.values(fontClassMap));

  if (settings.enabled && settings.fontKey) {
    document.body.classList.add(fontClassMap[settings.fontKey]);
  }
}

export default defineContentScript({
  matches: [],
  registration: "runtime",
  runAt: "document_idle",
  allFrames: false,
  main() {
    const origin = document.location.origin;

    // Handlers are registered synchronously because the popup messages the
    // content script immediately after executeScript resolves.
    let siteState = getSiteState(fontSwitcherDefaults, origin);

    onContractMessage(fontSwitcherMessages, {
      FONT_SWITCHER_GET_SITE_STATE: () => siteState,
      FONT_SWITCHER_SET_FONT: async (payload) => {
        const nextSettings = patchSiteState(await settingsStorage.get(), origin, payload);
        await settingsStorage.patch(nextSettings);
        siteState = getSiteState(nextSettings, origin);
        return siteState;
      },
      FONT_SWITCHER_SET_DEFAULT: async (payload) => {
        const nextSettings = patchDefaultFont(await settingsStorage.get(), payload.fontKey);
        await settingsStorage.patch({ defaultFont: payload.fontKey });
        siteState = getSiteState(nextSettings, origin);
        return siteState;
      },
    });

    void settingsStorage.get().then((nextSettings) => {
      siteState = getSiteState(nextSettings, origin);
      ensureStyles();
      applyState(siteState.settings);
    });

    settingsStorage.subscribe((nextSettings) => {
      siteState = getSiteState(nextSettings, origin);
      ensureStyles();
      applyState(siteState.settings);
    });
  },
});
