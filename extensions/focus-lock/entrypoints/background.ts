import { onContractMessage } from "@hub/shared/messaging";
import { createNamespacedStorage } from "@hub/shared/storage";
import { addDomain, normalizeDomainList, removeDomain } from "../lib/domains";
import { buildDnrRules, DNR_RULE_BASE_ID, DNR_RULE_MAX_COUNT } from "../lib/dnr";
import { focusLockMessages } from "../lib/messages";
import { hashPassword, verifyPassword } from "../lib/password";
import { focusLockDefaults, validateFocusLockSettings } from "../lib/types";
import type { FocusLockSettings, FocusLockState } from "../lib/types";

const settingsStorage = createNamespacedStorage("focus-lock.settings", focusLockDefaults, "local", {
  validate: validateFocusLockSettings,
});

const FAILED_ATTEMPT_LIMIT = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;
const UNLOCK_DURATION_MS = 5 * 60 * 1000;
const COOLDOWN_DURATION_MS = 60 * 1000;

function stateFromSettings(settings: FocusLockSettings): FocusLockState {
  return {
    domains: settings.domains,
    hasPassword: Boolean(settings.passwordHash),
    failedAttempts: settings.failedAttempts,
    ...(settings.lockoutUntil ? { lockedUntil: settings.lockoutUntil } : {}),
    unlockedDomains: Object.entries(settings.unlockedUntil)
      .filter(([domain, until]) => settings.domains.includes(domain) && until > Date.now())
      .map(([domain]) => domain),
  };
}

async function syncDnrRules(): Promise<void> {
  const settings = await settingsStorage.get();
  const { rules } = buildDnrRules(settings, Date.now());
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing
    .map((rule) => rule.id)
    .filter(
      (ruleId) => ruleId >= DNR_RULE_BASE_ID && ruleId < DNR_RULE_BASE_ID + DNR_RULE_MAX_COUNT,
    );

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: rules,
  });
}

async function scheduleRelock(domain: string, unlockUntil: number): Promise<void> {
  await chrome.alarms.create(`focus-lock-relock:${domain}`, {
    when: unlockUntil,
  });
}

function unlockPatch(settings: FocusLockSettings, domains: string[], unlockUntil: number) {
  return domains.reduce<Record<string, number>>(
    (accumulator, domain) => {
      accumulator[domain] = unlockUntil;
      return accumulator;
    },
    { ...settings.unlockedUntil },
  );
}

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    void syncDnrRules();
  });
  chrome.runtime.onStartup.addListener(() => {
    void syncDnrRules();
  });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (!alarm.name.startsWith("focus-lock-relock:")) {
      return;
    }

    const domain = alarm.name.slice("focus-lock-relock:".length);
    void settingsStorage
      .get()
      .then((settings) =>
        settingsStorage.patch({
          unlockedUntil: Object.fromEntries(
            Object.entries(settings.unlockedUntil).filter(
              ([candidate, until]) => candidate !== domain || until > Date.now(),
            ),
          ),
        }),
      )
      .then(() => syncDnrRules());
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && "focus-lock.settings" in changes) {
      void syncDnrRules();
    }
  });

  onContractMessage(focusLockMessages, {
    FOCUS_LOCK_GET_STATE: async () => stateFromSettings(await settingsStorage.get()),
    FOCUS_LOCK_ADD_DOMAIN: async (payload) => {
      const settings = await settingsStorage.get();
      const domains = addDomain(settings.domains, payload.domain);
      await settingsStorage.patch({
        domains,
      });
      await syncDnrRules();

      return {
        domains,
      };
    },
    FOCUS_LOCK_REMOVE_DOMAIN: async (payload) => {
      const settings = await settingsStorage.get();
      const domains = removeDomain(settings.domains, payload.domain);
      const { [payload.domain]: _removed, ...unlockedUntil } = settings.unlockedUntil;
      await settingsStorage.patch({
        domains,
        unlockedUntil,
      });
      await syncDnrRules();

      return {
        domains,
      };
    },
    FOCUS_LOCK_IMPORT_DOMAINS: async (payload) => {
      const domains = normalizeDomainList(payload.domains);
      await settingsStorage.patch({
        domains,
      });
      await syncDnrRules();

      return {
        domains,
      };
    },
    FOCUS_LOCK_EXPORT_DOMAINS: async () => ({
      domains: (await settingsStorage.get()).domains,
    }),
    FOCUS_LOCK_SET_PASSWORD: async (payload) => {
      const settings = await settingsStorage.get();

      if (settings.passwordHash) {
        if (!payload.currentPassword || !settings.passwordSalt) {
          throw new Error("Current password is required.");
        }

        const isValid = await verifyPassword(
          payload.currentPassword,
          settings.passwordHash,
          settings.passwordSalt,
        );

        if (!isValid) {
          throw new Error("Current password is incorrect.");
        }
      }

      if (payload.newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }

      const { hash, salt } = await hashPassword(payload.newPassword);
      await settingsStorage.patch({
        passwordHash: hash,
        passwordSalt: salt,
        failedAttempts: 0,
      });

      return {
        hasPassword: true,
      };
    },
    FOCUS_LOCK_REMOVE_PASSWORD: async (payload) => {
      const settings = await settingsStorage.get();

      if (!settings.passwordHash || !settings.passwordSalt) {
        throw new Error("No password has been set.");
      }

      const isValid = await verifyPassword(
        payload.currentPassword,
        settings.passwordHash,
        settings.passwordSalt,
      );

      if (!isValid) {
        throw new Error("Current password is incorrect.");
      }

      await chrome.storage.local.set({
        "focus-lock.settings": {
          ...settings,
          passwordHash: undefined,
          passwordSalt: undefined,
          failedAttempts: 0,
        },
      });

      return {
        hasPassword: false,
      };
    },
    FOCUS_LOCK_UNLOCK: async (payload) => {
      const settings = await settingsStorage.get();
      const now = Date.now();

      if (settings.lockoutUntil && settings.lockoutUntil > now) {
        throw new Error("Too many failed attempts. Try again later.");
      }

      if (!settings.passwordHash || !settings.passwordSalt) {
        throw new Error("No password has been set.");
      }

      const isValid = await verifyPassword(
        payload.password,
        settings.passwordHash,
        settings.passwordSalt,
      );

      if (!isValid) {
        const failedAttempts = settings.failedAttempts + 1;
        const lockoutUntil =
          failedAttempts >= FAILED_ATTEMPT_LIMIT ? now + LOCKOUT_DURATION_MS : undefined;
        await settingsStorage.patch({
          failedAttempts,
          ...(lockoutUntil ? { lockoutUntil } : {}),
        });
        throw new Error("Incorrect password.");
      }

      const unlockUntil = now + UNLOCK_DURATION_MS;
      const domains = payload.domain ? [payload.domain] : settings.domains;
      await settingsStorage.patch({
        failedAttempts: 0,
        unlockedUntil: unlockPatch(settings, domains, unlockUntil),
      });
      await syncDnrRules();

      for (const domain of domains) {
        await scheduleRelock(domain, unlockUntil);
      }

      return {
        unlockUntil,
        ...(payload.domain ? { domain: payload.domain } : {}),
      };
    },
    FOCUS_LOCK_START_COOLDOWN: async (payload) => {
      const settings = await settingsStorage.get();

      if (settings.passwordHash) {
        throw new Error("Password is required to unlock.");
      }

      const unlockUntil = Date.now() + COOLDOWN_DURATION_MS;
      const domains = payload.domain ? [payload.domain] : settings.domains;
      await settingsStorage.patch({
        unlockedUntil: unlockPatch(settings, domains, unlockUntil),
      });
      await syncDnrRules();

      for (const domain of domains) {
        await scheduleRelock(domain, unlockUntil);
      }

      return {
        unlockUntil,
        ...(payload.domain ? { domain: payload.domain } : {}),
      };
    },
  });
});
