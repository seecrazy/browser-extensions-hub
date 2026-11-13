import type { FocusLockSettings } from "./types";

export const DNR_RULE_BASE_ID = 1000;
export const DNR_RULE_MAX_COUNT = 1000;

export function getUnlockedDomains(settings: FocusLockSettings, now: number): string[] {
  return Object.entries(settings.unlockedUntil)
    .filter(([domain, until]) => settings.domains.includes(domain) && until > now)
    .map(([domain]) => domain);
}

export function buildDnrRules(settings: FocusLockSettings, now: number) {
  const unlockedDomains = new Set(getUnlockedDomains(settings, now));
  const blockedDomains = settings.domains.filter((domain) => !unlockedDomains.has(domain));

  return {
    rules: blockedDomains.slice(0, DNR_RULE_MAX_COUNT).map((domain, index) => ({
      id: DNR_RULE_BASE_ID + index,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          extensionPath: `/blocked.html?domain=${encodeURIComponent(domain)}`,
        },
      },
      condition: {
        requestDomains: [domain],
        resourceTypes: ["main_frame"],
      },
    })),
    blockedDomains,
  } as {
    rules: chrome.declarativeNetRequest.Rule[];
    blockedDomains: string[];
  };
}
