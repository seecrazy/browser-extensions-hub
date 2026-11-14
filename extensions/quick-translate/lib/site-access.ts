import { browser } from "wxt/browser";

import type { TranslateSettings } from "./types";

export type SiteAccessState = {
  origin: string;
  pattern?: string;
  enabled: boolean;
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

export async function requestSitePermission(origin: string): Promise<boolean> {
  const pattern = originToMatchPattern(origin);

  if (!pattern) {
    throw new Error("Only http and https sites can be enabled.");
  }

  return browser.permissions.request({
    origins: [pattern],
  });
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

export async function syncRegisteredSiteScripts(settings: TranslateSettings): Promise<void> {
  const registered = await browser.scripting.getRegisteredContentScripts();
  const registeredIds = new Set(
    registered
      .filter((script) => script.id?.startsWith("quick-translate-"))
      .map((script) => script.id),
  );
  const expectedIds = new Set(settings.enabledOrigins.map(createSiteScriptId));

  for (const id of registeredIds) {
    if (!expectedIds.has(id)) {
      await browser.scripting.unregisterContentScripts({
        ids: [id],
      });
    }
  }

  for (const origin of settings.enabledOrigins) {
    const granted = await isSitePermissionGranted(origin);

    if (!granted) {
      await browser.scripting.unregisterContentScripts({
        ids: [createSiteScriptId(origin)],
      });
      continue;
    }

    await registerSiteContentScript(origin);
  }
}
