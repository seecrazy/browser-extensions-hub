import { createNamespacedStorage } from "@hub/shared/storage";
import { defineMessageHandler } from "@hub/shared/messaging";
import { browser } from "wxt/browser";

type DarkModeSettings = {
  schemaVersion: number;
  enabled: boolean;
  strength: number;
};

const settingsStorage = createNamespacedStorage<DarkModeSettings>("dark-mode-lite.settings", {
  schemaVersion: 1,
  enabled: false,
  strength: 70,
});

const styleId = "__hub_dark_mode_lite_style__";

function applyDarkMode(settings: DarkModeSettings): void {
  let style = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!settings.enabled) {
    style?.remove();
    return;
  }

  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.append(style);
  }

  const strength = Math.min(100, Math.max(0, settings.strength));
  const strengthRatio = strength / 100;
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

async function initialize(): Promise<void> {
  const installedMarker = "__hubDarkModeLiteInstalled";
  const windowWithMarker = window as typeof window & {
    [installedMarker]?: boolean;
  };

  if (windowWithMarker[installedMarker]) {
    return;
  }

  windowWithMarker[installedMarker] = true;
  const settings = await settingsStorage.get();
  applyDarkMode(settings);

  settingsStorage.subscribe((nextSettings) => {
    applyDarkMode(nextSettings);
  });

  browser.runtime.onMessage.addListener(
    defineMessageHandler({
      DARK_MODE_GET_STATE: () => settingsStorage.get(),
      DARK_MODE_SET_STATE: async (payload) => {
        const nextSettings = await settingsStorage.patch(payload);
        applyDarkMode(nextSettings);
        return nextSettings;
      },
    }),
  );
}

export default defineContentScript({
  matches: [],
  registration: "runtime",
  runAt: "document_idle",
  allFrames: false,
  main() {
    void initialize();
  },
});
