import { getActiveTab, injectRuntimeContentScript } from "@hub/shared/injection";
import "@hub/shared/ui/styles.css";
import "./style.css";
import { createNamespacedStorage } from "@hub/shared/storage";
import { createStatusView } from "@hub/shared/ui";
import {
  disableAllSitesAccess,
  disableSiteAccess,
  enableAllSitesAccess,
  enableSiteAccess,
  getSiteAccessUi,
  isAllSitesPermissionGranted,
  isSitePermissionGranted,
  normalizeOrigin,
  reconcileRevokedSiteAccess,
} from "../../lib/site-access";
import { translateDefaults } from "../../lib/types";
import type { TranslateSettings } from "../../lib/types";

const settingsStorage = createNamespacedStorage("quick-translate.settings", translateDefaults);
const languageSelect = document.querySelector<HTMLSelectElement>("#language");
const originLabel = document.querySelector<HTMLElement>("#origin");
const allSitesChip = document.querySelector<HTMLSpanElement>("#all-sites-chip");
const siteStateChip = document.querySelector<HTMLSpanElement>("#site-state");
const activateButton = document.querySelector<HTMLButtonElement>("#activate");
const enableSiteButton = document.querySelector<HTMLButtonElement>("#enable-site");
const disableSiteButton = document.querySelector<HTMLButtonElement>("#disable-site");
const enableAllButton = document.querySelector<HTMLButtonElement>("#enable-all");
const disableAllButton = document.querySelector<HTMLButtonElement>("#disable-all");
const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));

let currentOrigin: string | null = null;

function setChip(element: HTMLElement | null, text: string, tone?: string, hidden = false): void {
  if (!element) {
    return;
  }

  element.textContent = text;
  element.hidden = hidden;

  if (tone) {
    element.dataset.tone = tone;
  } else {
    delete element.dataset.tone;
  }
}

function setButton(element: HTMLButtonElement | null, hidden: boolean): void {
  if (element) {
    element.hidden = hidden;
  }
}

function renderSiteState(settings: TranslateSettings): void {
  const ui = getSiteAccessUi(settings, currentOrigin ?? undefined);

  if (originLabel) {
    originLabel.textContent = ui.origin || "Unsupported page";
  }

  setChip(allSitesChip, "All-site access", "all", !ui.allSites);

  if (!ui.supported) {
    setChip(siteStateChip, "Unsupported page", "muted");
  } else if (ui.disabledOnThisOrigin) {
    setChip(siteStateChip, "Disabled on this site", "muted");
  } else if (ui.allSites) {
    setChip(siteStateChip, "Enabled via all sites", "active");
  } else if (ui.siteEnabled) {
    setChip(siteStateChip, "Enabled for this site", "active");
  } else {
    setChip(siteStateChip, "Not enabled", "muted");
  }

  setButton(enableSiteButton, !ui.showEnableSite);
  setButton(disableSiteButton, !ui.showDisableSite);
  setButton(enableAllButton, !ui.showEnableAll);
  setButton(disableAllButton, !ui.showDisableAll);
}

async function loadState(): Promise<void> {
  const tab = await getActiveTab();
  currentOrigin = normalizeOrigin(tab.url);
  const settings = await settingsStorage.get();

  if (languageSelect) {
    languageSelect.value = settings.targetLanguage;
  }

  if (currentOrigin) {
    const [siteGranted, allGranted] = await Promise.all([
      isSitePermissionGranted(currentOrigin),
      isAllSitesPermissionGranted(),
    ]);

    const reconciledSettings = reconcileRevokedSiteAccess(settings, {
      origin: currentOrigin,
      siteGranted,
      allGranted,
    });

    if (reconciledSettings !== settings) {
      await settingsStorage.patch(reconciledSettings);
    }

    renderSiteState(reconciledSettings);
    return;
  }

  renderSiteState(settings);
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

enableAllButton?.addEventListener("click", async () => {
  try {
    const settings = await settingsStorage.get();
    const nextSettings = await enableAllSitesAccess(settings);
    await settingsStorage.patch(nextSettings);
    renderSiteState(nextSettings);
    statusView.set("Enabled on all sites.");
  } catch (error) {
    statusView.set(
      error instanceof Error ? error.message : "All-site permission was not granted.",
      true,
    );
  }
});

disableAllButton?.addEventListener("click", async () => {
  try {
    const settings = await settingsStorage.get();
    const nextSettings = await disableAllSitesAccess(settings);
    await settingsStorage.patch(nextSettings);
    renderSiteState(nextSettings);
    statusView.set("All-site access revoked.");
  } catch (error) {
    statusView.set(error instanceof Error ? error.message : "Unable to revoke access.", true);
  }
});

void loadState();
