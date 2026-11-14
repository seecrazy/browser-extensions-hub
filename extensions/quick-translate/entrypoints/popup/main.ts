import { getActiveTab, injectRuntimeContentScript } from "@hub/shared/injection";
import { createTabMessageSender } from "@hub/shared/messaging";
import "@hub/shared/ui/styles.css";
import "./style.css";
import { createNamespacedStorage } from "@hub/shared/storage";
import { createAdvancedSettings, createLabel, createStatusView } from "@hub/shared/ui";
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
  setOriginDisabled,
} from "../../lib/site-access";
import { quickTranslateMessages } from "../../lib/messages";
import { translateDefaults } from "../../lib/types";
import type { TranslateSettings } from "../../lib/types";

const settingsStorage = createNamespacedStorage("quick-translate.settings", translateDefaults);
const languageSelect = document.querySelector<HTMLSelectElement>("#language");
const originLabel = document.querySelector<HTMLElement>("#origin");
const siteStateChip = document.querySelector<HTMLSpanElement>("#site-state");
const siteToggleButton = document.querySelector<HTMLButtonElement>("#site-toggle");
const siteToggleLabel = document.querySelector<HTMLElement>("#site-toggle-label");
const siteToggleNote = document.querySelector<HTMLElement>("#site-toggle-note");
const activateButton = document.querySelector<HTMLButtonElement>("#activate");
const enableAllButton = document.querySelector<HTMLButtonElement>("#enable-all");
const disableAllButton = document.querySelector<HTMLButtonElement>("#disable-all");
const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));
const timeoutLabel = createLabel("Request timeout", "timeout");
const timeoutSelect = document.createElement("select");
timeoutSelect.id = "timeout";
timeoutSelect.className = "hub-select";
const timeoutOptions: Array<[number, string]> = [
  [2000, "2 seconds"],
  [6000, "6 seconds"],
  [10000, "10 seconds"],
  [15000, "15 seconds"],
  [20000, "20 seconds"],
];

for (const [value, label] of timeoutOptions) {
  const option = document.createElement("option");
  option.value = String(value);
  option.textContent = label;
  timeoutSelect.append(option);
}
const timeoutAdvanced = createAdvancedSettings([timeoutLabel, timeoutSelect], {
  label: "Advanced request settings",
});
document.querySelector("#advanced")?.append(timeoutAdvanced.root);
const sendTabMessage = createTabMessageSender(quickTranslateMessages);

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

  if (!ui.supported) {
    setChip(siteStateChip, "Unsupported page", "muted");
    setButton(siteToggleButton, true);
    return;
  }

  if (ui.disabledOnThisOrigin) {
    setChip(siteStateChip, "Disabled on this site", "muted");
  } else if (ui.allSites) {
    setChip(siteStateChip, "Enabled via all sites", "active");
  } else if (ui.siteEnabled) {
    setChip(siteStateChip, "Enabled for this site", "active");
  } else {
    setChip(siteStateChip, "Not enabled", "muted");
  }

  setButton(siteToggleButton, false);

  if (siteToggleLabel) {
    siteToggleLabel.textContent = ui.showDisableSite
      ? "Disable on this site"
      : "Enable on this site";
  }

  if (siteToggleNote) {
    siteToggleNote.textContent = ui.showDisableSite
      ? ui.allSites
        ? "exception"
        : "revoke permission"
      : ui.allSites && ui.disabledOnThisOrigin
        ? "remove exception"
        : "asks once";
  }

  setButton(enableAllButton, !ui.showEnableAll);
  setButton(disableAllButton, !ui.showDisableAll);
}

async function injectCurrentTab(): Promise<void> {
  const tab = await getActiveTab();

  if (tab.tabId === undefined) {
    throw new Error("No active tab available.");
  }

  await injectRuntimeContentScript({
    file: "/content-scripts/quick-translate.js",
  });
}

async function loadState(): Promise<void> {
  const tab = await getActiveTab();
  currentOrigin = normalizeOrigin(tab.url);
  const settings = await settingsStorage.get();

  if (languageSelect) {
    languageSelect.value = settings.targetLanguage;
  }

  if (timeoutSelect) {
    timeoutSelect.value = String(settings.timeoutMs);
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

timeoutSelect?.addEventListener("change", async () => {
  await settingsStorage.patch({
    timeoutMs: Number(timeoutSelect.value),
  });
  statusView.set("Saved request timeout.");
});

activateButton?.addEventListener("click", async () => {
  try {
    const result = await injectRuntimeContentScript({
      file: "/content-scripts/quick-translate.js",
    });
    await sendTabMessage(result.tabId, {
      type: "QUICK_TRANSLATE_ENABLE_TEMPORARY",
    });
    statusView.set("Enabled for this tab. Select text to translate.");
  } catch (error) {
    statusView.set(
      error instanceof Error ? error.message : "This tab cannot use Quick Translate.",
      true,
    );
  }
});

siteToggleButton?.addEventListener("click", async () => {
  if (!currentOrigin) {
    statusView.set("Only http and https sites can be enabled.", true);
    return;
  }

  siteToggleButton.disabled = true;

  try {
    const settings = await settingsStorage.get();
    const ui = getSiteAccessUi(settings, currentOrigin);
    let nextSettings: TranslateSettings;

    if (ui.showDisableSite) {
      nextSettings =
        ui.allSites && !ui.disabledOnThisOrigin
          ? setOriginDisabled(settings, currentOrigin, true)
          : await disableSiteAccess(settings, currentOrigin);
    } else if (ui.allSites && ui.disabledOnThisOrigin) {
      nextSettings = setOriginDisabled(settings, currentOrigin, false);
    } else {
      nextSettings = await enableSiteAccess(settings, currentOrigin);
    }

    await settingsStorage.patch(nextSettings);

    if (ui.showEnableSite || (ui.allSites && !ui.disabledOnThisOrigin)) {
      await injectCurrentTab();
    }

    renderSiteState(nextSettings);
    statusView.set("Site access updated.");
  } catch (error) {
    statusView.set(error instanceof Error ? error.message : "Unable to update site access.", true);
  } finally {
    if (siteToggleButton) {
      siteToggleButton.disabled = false;
    }
  }
});

enableAllButton?.addEventListener("click", async () => {
  try {
    const settings = await settingsStorage.get();
    const nextSettings = await enableAllSitesAccess(settings);
    await settingsStorage.patch(nextSettings);
    await injectCurrentTab();
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
