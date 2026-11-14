import { getActiveTab, injectRuntimeContentScript } from "@hub/shared/injection";
import { createNamespacedStorage } from "@hub/shared/storage";
import { createStatusView } from "@hub/shared/ui";
import { browser } from "wxt/browser";
import { translateDefaults } from "../../lib/types";
import type { TranslateSettings } from "../../lib/types";
import {
  disableSiteAccess,
  enableSiteAccess,
  getSiteAccessState,
  isSitePermissionGranted,
  normalizeOrigin,
} from "../../lib/site-access";

const settingsStorage = createNamespacedStorage("quick-translate.settings", translateDefaults);
const languageSelect = document.querySelector<HTMLSelectElement>("#language");
const originLabel = document.querySelector<HTMLParagraphElement>("#origin");
const activateButton = document.querySelector<HTMLButtonElement>("#activate");
const enableSiteButton = document.querySelector<HTMLButtonElement>("#enable-site");
const disableSiteButton = document.querySelector<HTMLButtonElement>("#disable-site");
const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));

let currentOrigin: string | null = null;

function renderSiteState(settings: TranslateSettings): void {
  const state = getSiteAccessState(settings, currentOrigin ?? undefined);

  if (originLabel) {
    originLabel.textContent = state.origin || "Unsupported page";
  }

  if (enableSiteButton) {
    enableSiteButton.hidden = !state.supported || state.enabled;
  }

  if (disableSiteButton) {
    disableSiteButton.hidden = !state.supported || !state.enabled;
  }
}

async function loadState(): Promise<void> {
  const tab = await getActiveTab();
  currentOrigin = normalizeOrigin(tab.url);
  const settings = await settingsStorage.get();

  if (languageSelect) {
    languageSelect.value = settings.targetLanguage;
  }

  if (currentOrigin) {
    const granted = await isSitePermissionGranted(currentOrigin);
    const stored = getSiteAccessState(settings, currentOrigin).enabled;
    renderSiteState({
      ...settings,
      enabledOrigins: granted && stored ? settings.enabledOrigins : settings.enabledOrigins,
    });
  } else {
    renderSiteState(settings);
  }
}

languageSelect?.addEventListener("change", async () => {
  await settingsStorage.patch({
    targetLanguage: languageSelect.value,
  });
  statusView.set("Saved.");
});

activateButton?.addEventListener("click", async () => {
  try {
    await injectRuntimeContentScript({
      file: "/content-scripts/quick-translate.js",
    });
    statusView.set("Enabled for this tab. Select text to translate.");
  } catch (error) {
    statusView.set(
      error instanceof Error ? error.message : "This tab cannot use Quick Translate.",
      true,
    );
  }
});

enableSiteButton?.addEventListener("click", async () => {
  if (!currentOrigin) {
    statusView.set("Only http and https sites can be enabled.", true);
    return;
  }

  try {
    const settings = await settingsStorage.get();
    const nextSettings = await enableSiteAccess(settings, currentOrigin);
    await settingsStorage.patch(nextSettings);
    renderSiteState(nextSettings);
    statusView.set("Enabled for this site.");
  } catch (error) {
    statusView.set(
      error instanceof Error ? error.message : "Site permission was not granted.",
      true,
    );
  }
});

disableSiteButton?.addEventListener("click", async () => {
  if (!currentOrigin) {
    return;
  }

  try {
    const settings = await settingsStorage.get();
    const nextSettings = await disableSiteAccess(settings, currentOrigin);
    await settingsStorage.patch(nextSettings);
    renderSiteState(nextSettings);
    statusView.set("Disabled for this site.");
  } catch (error) {
    statusView.set(error instanceof Error ? error.message : "Unable to disable this site.", true);
  }
});

void loadState();

// Keep browser reference explicit for bundlers that tree-shake extension globals.
void browser;
