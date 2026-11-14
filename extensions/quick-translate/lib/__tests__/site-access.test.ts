import { beforeEach, describe, expect, it, vi } from "vitest";
const browserMock = vi.hoisted(() => ({
  permissions: {
    contains: vi.fn(),
    remove: vi.fn(),
  },
  scripting: {
    getRegisteredContentScripts: vi.fn(),
    registerContentScripts: vi.fn(),
    unregisterContentScripts: vi.fn(),
  },
}));

vi.mock("wxt/browser", () => ({
  browser: browserMock,
}));

import {
  ALL_SITE_PATTERNS,
  ALL_SITE_SCRIPT_ID,
  createSiteScriptId,
  getSiteAccessState,
  getSiteAccessUi,
  isSiteEnabled,
  isTranslationAllowed,
  normalizeOrigin,
  originToMatchPattern,
  reconcileRevokedSiteAccess,
  setOriginDisabled,
  setSiteEnabled,
  syncRegisteredSiteScripts,
} from "../site-access";
import { translateDefaults } from "../types";

type RegisteredScript = {
  id: string;
  matches: string[];
};

const scriptRegistry = new Map<string, RegisteredScript>();
const grantedPatterns = new Set<string>();

function createScript(id: string, matches: string[]): RegisteredScript {
  return {
    id,
    matches,
  };
}

beforeEach(() => {
  scriptRegistry.clear();
  grantedPatterns.clear();

  browserMock.permissions.contains.mockImplementation(async ({ origins }: { origins: string[] }) =>
    origins.every((pattern) => grantedPatterns.has(pattern)),
  );
  browserMock.permissions.remove.mockImplementation(async ({ origins }: { origins: string[] }) => {
    origins.forEach((pattern) => grantedPatterns.delete(pattern));
  });
  browserMock.scripting.getRegisteredContentScripts.mockImplementation(async () => [
    ...scriptRegistry.values(),
  ]);
  browserMock.scripting.registerContentScripts.mockImplementation(
    async (scripts: RegisteredScript[]) => {
      scripts.forEach((script) => {
        scriptRegistry.set(script.id, createScript(script.id, script.matches));
      });
    },
  );
  browserMock.scripting.unregisterContentScripts.mockImplementation(
    async ({ ids }: { ids: string[] }) => {
      ids.forEach((id) => scriptRegistry.delete(id));
    },
  );
});

describe("quick translate site access", () => {
  it("normalizes origins and match patterns", () => {
    expect(normalizeOrigin("https://www.example.com/path?query=1")).toBe("https://www.example.com");
    expect(originToMatchPattern("https://www.example.com/path")).toBe("https://www.example.com/*");
    expect(originToMatchPattern("chrome://extensions")).toBeNull();
    expect(normalizeOrigin(undefined)).toBeNull();
  });

  it("creates stable script ids", () => {
    const first = createSiteScriptId("https://example.com/path");
    const second = createSiteScriptId("https://example.com/other");

    expect(first).toBe(second);
    expect(first).toMatch(/^quick-translate-[0-9a-z]+$/);
  });

  it("toggles and reports per-site state", () => {
    const enabled = setSiteEnabled(translateDefaults, "https://example.com/page", true);

    expect(isSiteEnabled(enabled, "https://example.com/other")).toBe(true);
    expect(getSiteAccessState(enabled, "https://example.com/page")).toEqual({
      origin: "https://example.com",
      pattern: "https://example.com/*",
      enabled: true,
      allSites: false,
      disabledOnThisOrigin: false,
      supported: true,
    });

    const disabled = setSiteEnabled(enabled, "https://example.com/other", false);
    expect(isSiteEnabled(disabled, "https://example.com")).toBe(false);
    expect(getSiteAccessState(disabled, "https://example.com")).toEqual({
      origin: "https://example.com",
      pattern: "https://example.com/*",
      enabled: false,
      allSites: false,
      disabledOnThisOrigin: false,
      supported: true,
    });
  });

  it("allows explicit one-tab translation while respecting site exceptions", () => {
    expect(isTranslationAllowed(translateDefaults, "https://example.com", true)).toBe(true);
    expect(isTranslationAllowed(translateDefaults, "https://example.com", false)).toBe(false);

    const disabledOrigin = setOriginDisabled(translateDefaults, "https://example.com", true);

    expect(isTranslationAllowed(disabledOrigin, "https://example.com", true)).toBe(false);
    expect(isTranslationAllowed(disabledOrigin, "https://example.com", false)).toBe(false);
  });

  it("exposes correct access controls for per-site mode", () => {
    const enabled = setSiteEnabled(translateDefaults, "https://example.com", true);
    const enabledUi = getSiteAccessUi(enabled, "https://example.com");

    expect(enabledUi).toMatchObject({
      supported: true,
      allSites: false,
      siteEnabled: true,
      showEnableSite: false,
      showDisableSite: true,
      showEnableAll: true,
      showDisableAll: false,
    });

    const disabledUi = getSiteAccessUi(translateDefaults, "https://example.com");

    expect(disabledUi).toMatchObject({
      supported: true,
      allSites: false,
      siteEnabled: false,
      showEnableSite: true,
      showDisableSite: false,
      showEnableAll: true,
      showDisableAll: false,
    });
  });

  it("exposes correct access controls for all-site mode and exceptions", () => {
    const allSites = {
      ...translateDefaults,
      enabledAllSites: true,
    };
    const enabledUi = getSiteAccessUi(allSites, "https://example.com");

    expect(enabledUi).toMatchObject({
      allSites: true,
      siteEnabled: false,
      disabledOnThisOrigin: false,
      showEnableSite: false,
      showDisableSite: true,
      showEnableAll: false,
      showDisableAll: true,
    });

    const disabledOrigin = setOriginDisabled(allSites, "https://example.com", true);
    const disabledUi = getSiteAccessUi(disabledOrigin, "https://example.com");

    expect(disabledUi).toMatchObject({
      allSites: true,
      siteEnabled: false,
      disabledOnThisOrigin: true,
      showEnableSite: true,
      showDisableSite: false,
      showEnableAll: false,
      showDisableAll: true,
    });
  });

  it("persists reconciliation when browser permissions were revoked", () => {
    const enabled = setSiteEnabled(
      {
        ...translateDefaults,
        enabledAllSites: true,
      },
      "https://example.com",
      true,
    );
    const reconciled = reconcileRevokedSiteAccess(enabled, {
      origin: "https://example.com",
      siteGranted: false,
      allGranted: true,
    });

    expect(reconciled.enabledOrigins).toEqual([]);
    expect(reconciled.enabledAllSites).toBe(true);

    const fullyRevoked = reconcileRevokedSiteAccess(reconciled, {
      origin: "https://example.com",
      siteGranted: false,
      allGranted: false,
    });

    expect(fullyRevoked.enabledAllSites).toBe(false);
  });

  it("registers and revokes a per-site content script", async () => {
    const pattern = "https://example.com/*";
    const id = createSiteScriptId("https://example.com");
    grantedPatterns.add(pattern);

    await syncRegisteredSiteScripts({
      ...translateDefaults,
      enabledOrigins: ["https://example.com"],
    });

    expect(scriptRegistry.get(id)).toEqual(createScript(id, [pattern]));

    grantedPatterns.delete(pattern);
    await syncRegisteredSiteScripts({
      ...translateDefaults,
      enabledOrigins: ["https://example.com"],
    });

    expect(scriptRegistry.has(id)).toBe(false);
  });

  it("keeps all-site scripts synchronized and removes stale scripts", async () => {
    const staleId = createSiteScriptId("https://stale.example");
    scriptRegistry.set(staleId, createScript(staleId, ["https://stale.example/*"]));
    ALL_SITE_PATTERNS.forEach((pattern) => grantedPatterns.add(pattern));

    await syncRegisteredSiteScripts({
      ...translateDefaults,
      enabledAllSites: true,
    });

    expect(scriptRegistry.has(ALL_SITE_SCRIPT_ID)).toBe(true);
    expect(scriptRegistry.has(staleId)).toBe(false);
  });
});
