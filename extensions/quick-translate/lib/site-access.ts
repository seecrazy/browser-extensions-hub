import { browser } from "wxt/browser";

import type { TranslateSettings } from "./types";

export const ALL_SITE_PATTERNS = ["http://*/*", "https://*/*"];
export const ALL_SITE_SCRIPT_ID = "quick-translate-all-sites";

export type SiteAccessUi = {
  origin: string;
  supported: boolean;
  allSites: boolean;
  siteEnabled: boolean;
  disabledOnThisOrigin: boolean;
  showEnableSite: boolean;
  showDisableSite: boolean;
  showEnableAll: boolean;
  showDisableAll: boolean;
};

export type SiteAccessState = {
  origin: string;
  pattern?: string;
  enabled: boolean;
  allSites: boolean;
  disabledOnThisOrigin: boolean;
  supported: boolean;
};

export type RegisteredSiteScript = {
  id?: string;
  matches?: string[];
};

export function normalizeOrigin(input: string | undefined): string | null {
  if (!input) {
    return null;
  }

  try {
    const url = new URL(input);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export function originToMatchPattern(origin: string): string | null {
  const normalized = normalizeOrigin(origin);

  return normalized ? `${normalized}/*` : null;
}

export function createSiteScriptId(origin: string): string {
  const normalized = normalizeOrigin(origin) ?? origin;
  let hash = 2166136261;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `quick-translate-${(hash >>> 0).toString(36)}`;
}

export function isAllSitesEnabled(settings: TranslateSettings): boolean {
  return settings.enabledAllSites;
}

export function isOriginDisabled(settings: TranslateSettings, origin: string): boolean {
  const normalized = normalizeOrigin(origin);
  return normalized ? settings.disabledOrigins.includes(normalized) : false;
}

export function isOriginActive(settings: TranslateSettings, origin: string): boolean {
  const normalized = normalizeOrigin(origin);

  if (!normalized) {
    return false;
  }

  if (settings.disabledOrigins.includes(normalized)) {
    return false;
  }

  return settings.enabledAllSites || settings.enabledOrigins.includes(normalized);
}

export function setOriginDisabled(
  settings: TranslateSettings,
  origin: string,
  disabled: boolean,
): TranslateSettings {
  const normalized = normalizeOrigin(origin);

  if (!normalized) {
    return settings;
  }

  const disabledOrigins = disabled
    ? [...new Set([...settings.disabledOrigins, normalized])]
    : settings.disabledOrigins.filter((candidate) => candidate !== normalized);

  return {
    ...settings,
    disabledOrigins,
  };
}

export function isSiteEnabled(settings: TranslateSettings, origin: string): boolean {
  const normalized = normalizeOrigin(origin);
  return normalized ? settings.enabledOrigins.includes(normalized) : false;
}

export function setSiteEnabled(
  settings: TranslateSettings,
  origin: string,
  enabled: boolean,
): TranslateSettings {
  const normalized = normalizeOrigin(origin);

  if (!normalized) {
    return settings;
  }

  const enabledOrigins = enabled
    ? [...new Set([...settings.enabledOrigins, normalized])]
    : settings.enabledOrigins.filter((candidate) => candidate !== normalized);

  return {
    ...settings,
    enabledOrigins,
  };
}

export function getSiteAccessState(
  settings: TranslateSettings,
  origin: string | undefined,
): SiteAccessState {
  const normalized = normalizeOrigin(origin);
  const pattern = normalized ? (originToMatchPattern(normalized) ?? undefined) : undefined;

  return {
    origin: normalized ?? "",
    ...(pattern ? { pattern } : {}),
    enabled: normalized ? isSiteEnabled(settings, normalized) : false,
    allSites: settings.enabledAllSites,
    disabledOnThisOrigin: normalized ? isOriginDisabled(settings, normalized) : false,
    supported: Boolean(normalized),
  };
}

export async function isSitePermissionGranted(origin: string): Promise<boolean> {
  const pattern = originToMatchPattern(origin);

  if (!pattern) {
    return false;
  }

  return browser.permissions.contains({
    origins: [pattern],
  });
}

export function getSiteAccessUi(
  settings: TranslateSettings,
  origin: string | undefined,
): SiteAccessUi {
  const state = getSiteAccessState(settings, origin);
  const showEnableSite =
    state.supported && (!state.allSites || state.disabledOnThisOrigin) && !state.enabled;
  const showDisableSite =
    state.supported &&
    ((state.allSites && !state.disabledOnThisOrigin) || (!state.allSites && state.enabled));

  return {
    origin: state.origin,
    supported: state.supported,
    allSites: state.allSites,
    siteEnabled: state.enabled,
    disabledOnThisOrigin: state.disabledOnThisOrigin,
    showEnableSite,
    showDisableSite,
    showEnableAll: !state.allSites,
    showDisableAll: state.allSites,
  };
}

export function reconcileRevokedSiteAccess(
  settings: TranslateSettings,
  input: {
    origin?: string;
    siteGranted: boolean;
    allGranted: boolean;
  },
): TranslateSettings {
  let nextSettings = settings;
  const origin = normalizeOrigin(input.origin);

  if (origin && !input.siteGranted) {
    nextSettings = setSiteEnabled(nextSettings, origin, false);
  }

  if (!input.allGranted) {
    nextSettings = {
      ...nextSettings,
      enabledAllSites: false,
    };
  }

  return nextSettings;
}

export async function isAllSitesPermissionGranted(): Promise<boolean> {
  return browser.permissions.contains({
    origins: ALL_SITE_PATTERNS,
  });
}

export async function requestAllSitesPermission(): Promise<boolean> {
  return browser.permissions.request({
    origins: ALL_SITE_PATTERNS,
  });
}

export async function requestSitePermission(origin: string): Promise<boolean> {
  const pattern = originToMatchPattern(origin);

  if (!pattern) {
    throw new Error("Only http and https sites can be enabled.");
  }

  return browser.permissions.request({
    origins: [pattern],
  });
}

export async function registerAllSitesContentScript(): Promise<void> {
  const registered = await browser.scripting.getRegisteredContentScripts();
  const alreadyRegistered = registered.some((script) => script.id === ALL_SITE_SCRIPT_ID);

  if (alreadyRegistered) {
    return;
  }

  await browser.scripting.registerContentScripts([
    {
      id: ALL_SITE_SCRIPT_ID,
      matches: ALL_SITE_PATTERNS,
      js: ["/content-scripts/quick-translate.js"],
      runAt: "document_idle",
      persistAcrossSessions: true,
    },
  ]);
}

export async function unregisterAllSitesContentScript(): Promise<void> {
  await browser.scripting.unregisterContentScripts({
    ids: [ALL_SITE_SCRIPT_ID],
  });
}

export async function enableAllSitesAccess(
  settings: TranslateSettings,
): Promise<TranslateSettings> {
  const granted = await requestAllSitesPermission();

  if (!granted) {
    throw new Error("All-site permission was not granted.");
  }

  await registerAllSitesContentScript();
  return {
    ...settings,
    enabledAllSites: true,
  };
}

export async function disableAllSitesAccess(
  settings: TranslateSettings,
): Promise<TranslateSettings> {
  await unregisterAllSitesContentScript();
  await browser.permissions.remove({
    origins: ALL_SITE_PATTERNS,
  });

  return {
    ...settings,
    enabledAllSites: false,
  };
}

export async function registerSiteContentScript(origin: string): Promise<void> {
  const pattern = originToMatchPattern(origin);

  if (!pattern) {
    throw new Error("Only http and https sites can be enabled.");
  }

  const id = createSiteScriptId(origin);
  const registered = await browser.scripting.getRegisteredContentScripts();
  const alreadyRegistered = registered.some(
    (script) => script.id === id && script.matches?.includes(pattern),
  );

  if (alreadyRegistered) {
    return;
  }

  await browser.scripting.registerContentScripts([
    {
      id,
      matches: [pattern],
      js: ["/content-scripts/quick-translate.js"],
      runAt: "document_idle",
      persistAcrossSessions: true,
    },
  ]);
}

export async function unregisterSiteContentScript(origin: string): Promise<void> {
  const pattern = originToMatchPattern(origin);

  if (!pattern) {
    return;
  }

  const id = createSiteScriptId(origin);
  const registered = await browser.scripting.getRegisteredContentScripts();
  const script = registered.find((candidate) => candidate.id === id);

  if (!script) {
    return;
  }

  await browser.scripting.unregisterContentScripts({
    ids: [id],
  });
}

export async function enableSiteAccess(
  settings: TranslateSettings,
  origin: string,
): Promise<TranslateSettings> {
  const granted = await requestSitePermission(origin);

  if (!granted) {
    throw new Error("Site permission was not granted.");
  }

  await registerSiteContentScript(origin);
  return setSiteEnabled(settings, origin, true);
}

export async function disableSiteAccess(
  settings: TranslateSettings,
  origin: string,
): Promise<TranslateSettings> {
  await unregisterSiteContentScript(origin);
  const pattern = originToMatchPattern(origin);

  if (pattern) {
    await browser.permissions.remove({
      origins: [pattern],
    });
  }

  return setSiteEnabled(settings, origin, false);
}

export async function syncRegisteredSiteScripts(
  settings: TranslateSettings,
): Promise<{ settings: TranslateSettings; changed: boolean }> {
  const registered = await browser.scripting.getRegisteredContentScripts();
  const registeredIds = new Set(
    registered
      .filter((script) => script.id?.startsWith("quick-translate-"))
      .map((script) => script.id),
  );
  const expectedIds = new Set([
    ...settings.enabledOrigins.map(createSiteScriptId),
    ...(settings.enabledAllSites ? [ALL_SITE_SCRIPT_ID] : []),
  ]);

  for (const id of registeredIds) {
    if (!expectedIds.has(id)) {
      await browser.scripting.unregisterContentScripts({
        ids: [id],
      });
    }
  }

  let nextSettings = settings;
  let changed = false;

  for (const origin of settings.enabledOrigins) {
    const granted = await isSitePermissionGranted(origin);

    if (!granted) {
      await unregisterSiteContentScript(origin);
      nextSettings = setSiteEnabled(nextSettings, origin, false);
      changed = true;
      continue;
    }

    await registerSiteContentScript(origin);
  }

  if (nextSettings.enabledAllSites) {
    const granted = await isAllSitesPermissionGranted();

    if (!granted) {
      await unregisterAllSitesContentScript();
      nextSettings = {
        ...nextSettings,
        enabledAllSites: false,
      };
      changed = true;
    } else {
      await registerAllSitesContentScript();
    }
  }

  return {
    settings: nextSettings,
    changed,
  };
}
